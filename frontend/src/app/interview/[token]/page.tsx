"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AxiosError } from "axios";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Sparkles,
  Clock,
  Users,
} from "lucide-react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

import { interviewApi } from "@/lib/interview-api";
import { useAuthStore } from "@/lib/auth-store";
import { useListen } from "@/lib/use-voice";
import { normaliseTechTerms } from "@/lib/transcript-cleanup";
import { toast } from "@/components/ui/Toast";
import type { ApiError } from "@/types/auth";
import type { InterviewDto } from "@/types/interview";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080/api/ws";
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type Signal =
  | { type: "ready"; from: string }
  | { type: "offer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; from: string; candidate: RTCIceCandidateInit };

export default function InterviewRoomPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const me = useAuthStore((s) => s.user);

  const [session, setSession] = useState<InterviewDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [remoteJoined, setRemoteJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const stompRef = useRef<Client | null>(null);
  const selfIdRef = useRef<string>(crypto.randomUUID());

  // Capture the candidate's speech transcript for post-call AI evaluation.
  // Only the candidate side records (the company already has their own voice).
  const isCandidate = !!session && me?.id === session.candidateUserId;
  const listen = useListen();
  const listenRef = useRef(listen);
  listenRef.current = listen;
  const [evaluating, setEvaluating] = useState(false);

  // Load session metadata
  useEffect(() => {
    if (!accessToken) return;
    interviewApi
      .byToken(token)
      .then(setSession)
      .catch((err: AxiosError<ApiError>) => {
        setError(err.response?.data?.message ?? "Mülakat odası bulunamadı");
      });
  }, [token, accessToken]);

  // Init WebRTC + STOMP signaling
  useEffect(() => {
    if (!session || !accessToken || stompRef.current) return;

    let cancelled = false;

    const start = async () => {
      // 1) Get camera + mic
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
      } catch (err) {
        toast.error(
          "Kamera/mikrofon izni reddedildi",
          "Tarayıcı ayarlarından izin verip sayfayı yenile."
        );
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // 2) RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peerRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        const [remoteStream] = e.streams;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setRemoteJoined(true);
      };

      pc.onicecandidate = (e) => {
        if (e.candidate && stompRef.current?.active) {
          publish({ type: "ice", from: selfIdRef.current, candidate: e.candidate.toJSON() });
        }
      };

      // 3) STOMP signaling
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        connectHeaders: { Authorization: `Bearer ${accessToken}` },
        reconnectDelay: 4000,
        onConnect: () => {
          setConnected(true);
          client.subscribe(`/topic/interview/${token}`, async (frame: IMessage) => {
            try {
              const msg = JSON.parse(frame.body) as Signal;
              if (msg.from === selfIdRef.current) return;

              if (msg.type === "ready") {
                // Other peer is asking — we initiate
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                publish({ type: "offer", from: selfIdRef.current, sdp: offer });
              } else if (msg.type === "offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                publish({ type: "answer", from: selfIdRef.current, sdp: answer });
              } else if (msg.type === "answer") {
                await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
              } else if (msg.type === "ice") {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
                } catch (err) {
                  console.warn("ICE add failed", err);
                }
              }
            } catch (err) {
              console.warn("signal parse error", err);
            }
          });
          // Announce we're here
          publish({ type: "ready", from: selfIdRef.current });
        },
      });
      stompRef.current = client;
      client.activate();

      // Mark started
      try {
        await interviewApi.start(token);
      } catch {}

      // Candidate-only: start live transcription for the AI evaluation that
      // fires when they hang up. Browsers that don't support SpeechRecognition
      // (Firefox today) just skip — call still works, evaluation will note
      // an empty transcript.
      if (isCandidate && listenRef.current.supported) {
        try {
          listenRef.current.start({ lang: "tr-TR", continuous: true, interim: true });
        } catch {}
      }
    };

    start();

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerRef.current?.close();
      stompRef.current?.deactivate();
      peerRef.current = null;
      stompRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, accessToken]);

  const publish = (msg: Signal) => {
    stompRef.current?.publish({
      destination: `/app/interview/${token}/signal`,
      body: JSON.stringify(msg),
    });
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };
  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  };

  const hangUp = async () => {
    // Candidate: stop SR, push transcript to backend for Gemini evaluation.
    let evaluated = false;
    if (isCandidate) {
      try {
        listenRef.current.stop();
        const transcript = normaliseTechTerms(
          (listenRef.current.transcript + " " + listenRef.current.interimText).trim()
        );
        if (transcript) {
          setEvaluating(true);
          await interviewApi.evaluate(token, transcript);
          evaluated = true;
        } else {
          await interviewApi.end(token);
        }
      } catch {
        try { await interviewApi.end(token); } catch {}
      } finally {
        setEvaluating(false);
      }
    } else {
      try {
        await interviewApi.end(token);
      } catch {}
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    stompRef.current?.deactivate();
    if (evaluated) {
      toast.ai("🎯 AI değerlendirmesi hazırlandı", "Şirket panelinden görebilir.");
    } else {
      toast.info("Mülakat sonlandırıldı");
    }
    router.push(me?.role === "COMPANY" ? "/company/interviews" : "/dashboard/interviews");
  };

  if (!accessToken) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg p-6 text-center">
        <div>
          <p className="text-text-muted">Bu sayfayı görmek için giriş yap.</p>
          <Link href="/login" className="btn btn--ai mt-4 inline-flex">
            Giriş yap
          </Link>
        </div>
      </main>
    );
  }
  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">{error}</h1>
          <Link href="/" className="btn btn--outline mt-4 inline-flex">
            Ana sayfa
          </Link>
        </div>
      </main>
    );
  }
  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg p-6 text-text-muted">
        Mülakat odası yükleniyor...
      </main>
    );
  }

  const otherParty =
    me?.id === session.candidateUserId ? session.companyName : session.candidateName;

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-black/80 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg ai-grad">
            <Video size={15} />
          </span>
          <div>
            <p className="text-[13px] font-semibold tracking-tight">
              Synapse Mülakat · {session.jobTitle}
            </p>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-white/60">
              <Sparkles size={9} className="inline" /> Peer-to-peer · {connected ? "🟢 Bağlı" : "⚪ Bağlanıyor"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[12px] text-white/80">
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} /> {remoteJoined ? "2/2" : "1/2"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} /> {session.durationMin} dk
          </span>
        </div>
      </header>

      {/* Video grid */}
      <div className="grid flex-1 grid-cols-1 gap-3 p-4 md:grid-cols-2 md:p-6">
        <Tile
          ref={remoteVideoRef}
          label={remoteJoined ? otherParty : `${otherParty} bekleniyor...`}
          muted={false}
          waiting={!remoteJoined}
        />
        <Tile ref={localVideoRef} label={`Sen — ${me?.firstName ?? ""}`} muted />
      </div>

      {/* Controls */}
      <footer className="border-t border-white/10 bg-black/90 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3">
          <ControlButton onClick={toggleMic} on={micOn} icon={micOn ? <Mic size={18} /> : <MicOff size={18} />} />
          <ControlButton onClick={toggleCam} on={camOn} icon={camOn ? <Video size={18} /> : <VideoOff size={18} />} />
          <button
            type="button"
            onClick={hangUp}
            className="grid h-14 w-14 place-items-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-500"
            aria-label="Mülakatı bitir"
          >
            <PhoneOff size={20} />
          </button>
        </div>
        <p className="mt-2 text-center font-mono text-[10.5px] uppercase tracking-wider text-white/40">
          Görüşme tarayıcıda — sunucu video iletmez
          {isCandidate && listen.supported && (
            <>
              {" · "}
              {listen.listening ? (
                <span className="text-emerald-400">🎙 transkript kaydediliyor</span>
              ) : (
                <span className="text-white/40">transkript durdu</span>
              )}
              {" · "}
              {listen.transcript.length} karakter
            </>
          )}
          {evaluating && (
            <> · <span className="text-ai-2 animate-pulse">AI değerlendiriyor...</span></>
          )}
        </p>
      </footer>
    </main>
  );
}

interface TileProps {
  label: string;
  muted: boolean;
  waiting?: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tile = (function () {
  function TileInner(
    { label, muted, waiting }: TileProps,
    ref: React.ForwardedRef<HTMLVideoElement>
  ) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/80">
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted}
          className="h-full w-full object-cover"
        />
        {waiting && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div
                className="mx-auto mb-3 h-12 w-12 rounded-full ai-grad"
                style={{ animation: "core-pulse 1.5s ease-in-out infinite" }}
              />
              <p className="text-sm text-white/70">{label}</p>
            </div>
          </div>
        )}
        <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 font-mono text-[10.5px] uppercase tracking-wider text-white">
          {label}
        </span>
      </div>
    );
  }
  TileInner.displayName = "Tile";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (typeof window !== "undefined" ? require("react").forwardRef(TileInner) : (TileInner as any));
})();

function ControlButton({
  onClick,
  on,
  icon,
}: {
  onClick: () => void;
  on: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-12 w-12 place-items-center rounded-full transition ${
        on
          ? "bg-white/10 text-white hover:bg-white/20"
          : "bg-red-600/80 text-white hover:bg-red-500"
      }`}
    >
      {icon}
    </button>
  );
}

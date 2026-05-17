import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Gizlilik Politikası · Synapse",
  description: "Synapse'in kullanıcı verilerini nasıl topladığı, kullandığı ve sakladığı.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="bg-gradient-to-r from-[var(--ai-1)] via-[var(--ai-2)] to-[var(--ai-3)] bg-clip-text text-4xl font-bold text-transparent">
          Gizlilik Politikası
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Son güncelleme: 17 Mayıs 2026
        </p>

        <section className="mt-10 space-y-6 text-[var(--text-2)]">
          <p>
            Bu politika, Synapse platformunu kullanırken topladığımız bilgileri,
            bu bilgileri nasıl kullandığımızı ve haklarınızı açıklar. Yasal
            dayanak için <a className="underline" href="/legal/kvkk">KVKK Aydınlatma Metni</a>{" "}
            ek belge olarak okunmalıdır.
          </p>

          <h2 className="text-xl font-semibold text-white">Topladığımız veriler</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li><strong>Hesap:</strong> e-posta, ad-soyad, parola özeti (bcrypt).</li>
            <li><strong>İçerik:</strong> CV, GitHub linki, mülakat transkripleri.</li>
            <li><strong>Telemetri:</strong> tarayıcı tipi, IP, oturum süresi.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">Nasıl kullanıyoruz</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Yetkinlik doğrulama ve iş eşleştirme.</li>
            <li>Hesabınızı güvende tutma (oran sınırlama, anomali tespiti).</li>
            <li>Platformun iyileştirilmesi için anonim toplu metrikler.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">Çerezler</h2>
          <p>
            Yalnızca zorunlu çerezler varsayılan olarak kullanılır. Analiz
            çerezleri için açık rızanız çerez bildiriminde alınır.
          </p>

          <h2 className="text-xl font-semibold text-white">Hesap silme</h2>
          <p>
            Hesabınızı dilediğiniz zaman ayarlar sayfasından silebilirsiniz. 30
            gün içinde tüm kişisel veriler kaldırılır.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

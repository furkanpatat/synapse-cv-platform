import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kullanım Şartları · Synapse",
  description: "Synapse platformunu kullanmaya ilişkin koşullar.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="bg-gradient-to-r from-[var(--ai-1)] via-[var(--ai-2)] to-[var(--ai-3)] bg-clip-text text-4xl font-bold text-transparent">
          Kullanım Şartları
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Son güncelleme: 17 Mayıs 2026
        </p>

        <section className="mt-10 space-y-6 text-[var(--text-2)]">
          <p>
            Synapse'i kullanarak aşağıdaki şartları kabul etmiş olursunuz.
            Kabul etmiyorsanız lütfen platformu kullanmayınız.
          </p>

          <h2 className="text-xl font-semibold text-white">Hesap sorumluluğu</h2>
          <p>
            Hesap güvenliğinden (parola, 2FA) siz sorumlusunuz. Şüpheli giriş
            tespit edilirse 2FA aktif olsa bile tüm oturumları iptal ederiz.
          </p>

          <h2 className="text-xl font-semibold text-white">
            Yasaklı kullanım
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Başkasının kimliğiyle hesap açmak.</li>
            <li>
              AI ile tamamen üretilmiş, gerçeği yansıtmayan CV'leri "kanıtlanmış"
              gibi göstermeye çalışmak.
            </li>
            <li>Platforma karşı otomatik scraping veya DDoS davranışı.</li>
            <li>Diğer kullanıcılara taciz, ayrımcılık, dolandırıcılık.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">Hizmet seviyesi</h2>
          <p>
            Synapse bir akademik prototiptir; hizmet "olduğu gibi" sunulur ve
            kesintisizlik garantisi vermez. Production-grade SLO için ticari
            sürüm beklenir.
          </p>

          <h2 className="text-xl font-semibold text-white">Sonlandırma</h2>
          <p>
            Şartların ihlal edildiği tespit edilirse hesabınızı bildirimsiz
            askıya alma hakkımız saklıdır. Hesabınızı her zaman ayarlardan
            silebilirsiniz.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

import type { Metadata } from "next";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni · Synapse",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Synapse platformunun veri işleme esasları.",
};

/**
 * Aydınlatma metni — 6698 sayılı KVKK'nın 10. maddesi kapsamında
 * zorunlu. Bu metin tez projesi için hazırlanmış olup, gerçek bir
 * şirket dağıtımı öncesinde bir hukuk danışmanı tarafından gözden
 * geçirilmelidir.
 */
export default function KvkkPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="bg-gradient-to-r from-[var(--ai-1)] via-[var(--ai-2)] to-[var(--ai-3)] bg-clip-text text-4xl font-bold text-transparent">
          KVKK Aydınlatma Metni
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Son güncelleme: 17 Mayıs 2026
        </p>

        <section className="prose-invert mt-10 space-y-6 text-[var(--text-2)]">
          <h2 className="text-xl font-semibold text-white">1. Veri Sorumlusu</h2>
          <p>
            Synapse, Süleyman Demirel Üniversitesi Bilgisayar Mühendisliği
            bitirme projesi kapsamında Furkan Patat tarafından geliştirilen
            akademik bir prototiptir. İletişim:{" "}
            <a className="underline" href="mailto:furkan@synapse.example">
              furkan@synapse.example
            </a>
          </p>

          <h2 className="text-xl font-semibold text-white">
            2. İşlenen Kişisel Veriler
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Kimlik bilgileri: ad, soyad, e-posta.</li>
            <li>
              Profesyonel veriler: CV içeriği, GitHub kullanıcı adı, yetkinlik
              skorları, mülakat transkripleri.
            </li>
            <li>
              İşlem güvenliği: IP adresi, oturum tokenları, çerez tercihleri.
            </li>
            <li>
              Ödeme verileri: yalnızca ödeme sağlayıcısı (Iyzico) üzerinden
              maskelenmiş referanslar; kart numarası saklanmaz.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-white">
            3. İşleme Amaçları
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Hesap oluşturma ve kimlik doğrulama (JWT + 2FA).</li>
            <li>
              CV'nin AI ile doğrulanması, GitHub kanıtıyla yetkinlik eşleştirme.
            </li>
            <li>İş ilanlarıyla semantik eşleştirme.</li>
            <li>
              Mülakat hazırlık ve gerçek görüşme kayıtlarının değerlendirilmesi.
            </li>
            <li>Hizmet güvenliği, kötüye kullanım ve dolandırıcılık tespiti.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">
            4. Aktarılan Üçüncü Taraflar
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Google Gemini API — anonimleştirilmiş CV/mülakat metni LLM
              değerlendirmesi için.
            </li>
            <li>GitHub API — kullanıcının açık profil verisi okunur.</li>
            <li>Iyzico — ödeme işleme.</li>
            <li>
              Sentry — hata izleme (PII gönderilmez, kullanıcı isteğine bağlı).
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-white">
            5. Saklama Süreleri
          </h2>
          <p>
            Hesap aktifken veriler işlenmeye devam eder. Hesap silindiğinde
            kişisel veriler 30 gün içinde anonimleştirilir; denetim logları
            yasal zorunluluk gereği 90 gün boyunca tutulur ve sonrasında soğuk
            arşive (S3) taşınır.
          </p>

          <h2 className="text-xl font-semibold text-white">
            6. KVKK m.11 Haklarınız
          </h2>
          <p>
            Verilerinize erişme, düzeltme, silme, işlemeye itiraz etme ve
            taşınabilirlik haklarınızı kullanmak için yukarıdaki e-posta
            adresine başvurabilirsiniz. Talep 30 gün içinde
            sonuçlandırılır.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

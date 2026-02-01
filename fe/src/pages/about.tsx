import MainLayout from "@/layouts/main";

export default function DocsPage() {
  return (
    <MainLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <div className="text-6xl font-bold text-emerald-500 bg-black p-6">
            Tailwind + HeroUI OK
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

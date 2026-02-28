import { Card } from "@/components/ui/card";

type PlaceholderPageProps = {
  title: string;
  message: string;
};

export function PlaceholderPage({ title, message }: PlaceholderPageProps) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <Card className="px-6 py-10 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">{title}</h1>
        <p className="mt-4 text-sm text-[var(--text-muted)]">{message}</p>
      </Card>
    </section>
  );
}

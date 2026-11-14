import { Link } from 'react-router';
import { Button } from '@/components/ui/button.tsx';

export function BookPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-4 py-12 sm:py-20">
      <h1 className="text-3xl font-bold tracking-tight">Бронирование</h1>
      <p className="text-lg text-muted-foreground">Скоро здесь можно будет записаться</p>
      <Button asChild variant="outline" size="lg" className="h-11 px-6 text-base">
        <Link to="/">На главную</Link>
      </Button>
    </div>
  );
}

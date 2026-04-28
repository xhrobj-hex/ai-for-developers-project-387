import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function NotFoundPage() {
  return (
    <section className="screen-grid">
      <Card className="screen-state">
        <CardHeader>
          <CardTitle>Страница не найдена</CardTitle>
          <CardDescription>Такой страницы здесь нет. Вернитесь к записи и начните заново.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link className={cn("ui-button", "ui-button--primary")} to="/">
            К списку встреч
          </Link>
        </CardContent>
      </Card>
    </section>
  );
}

import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { AdminPage } from "@/pages/admin-page";
import { BookingConfirmPage } from "@/pages/booking-confirm-page";
import { BookEventPage } from "@/pages/book-event-page";
import { HomePage } from "@/pages/home-page";
import { NotFoundPage } from "@/pages/not-found-page";

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "book/:eventTypeId",
        element: <BookEventPage />,
      },
      {
        path: "book/:eventTypeId/confirm",
        element: <BookingConfirmPage />,
      },
      {
        path: "admin",
        element: <AdminPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

import "./cms.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CMS — kinaiauto.com",
  robots: { index: false, follow: false },
};

export default function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-cms-root>{children}</div>;
}

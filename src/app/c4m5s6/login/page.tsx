import { LoginForm } from "@/components/cms/login-form";

export const dynamic = "force-dynamic";

export default async function CmsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;
  return (
    <div className="cms-login-wrap">
      <div className="cms-login">
        <h1>kinaiauto.com — CMS</h1>
        <div className="sub">Add meg az admin jelszót a folytatáshoz.</div>
        <LoginForm from={from ?? "/c4m5s6"} error={error} />
      </div>
    </div>
  );
}

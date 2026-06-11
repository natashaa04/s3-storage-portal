import UploadPanel from "@/components/upload-panel";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center px-6 py-4">
          <h1 className="text-lg font-semibold text-zinc-900">S3 Storage Portal</h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl justify-center px-6 py-12">
        <UploadPanel />
      </main>
    </div>
  );
}
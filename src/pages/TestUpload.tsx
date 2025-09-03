import { SimpleImageUpload } from "@/components/simple/SimpleImageUpload";

export default function TestUpload() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold">Teste de Upload de Imagem</h1>
          <SimpleImageUpload />
        </div>
      </div>
    </div>
  );
}
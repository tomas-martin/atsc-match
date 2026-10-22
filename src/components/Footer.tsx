import ClubShield from './ClubShield';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-blue-shield/20 py-8 px-4">
      <div className="max-w-lg mx-auto flex flex-col items-center gap-4 text-center">
        <ClubShield size={32} />
        <div>
          <p className="text-gray-blue text-sm font-medium">
            Andes Talleres Futsal · Mendoza, Argentina
          </p>
          <p className="text-gray-dark text-xs mt-1 font-semibold tracking-wider">
            #SomosTalleres #SomosFamilia
          </p>
        </div>
        <p className="text-gray-dark text-xs">
          © {new Date().getFullYear()} Andes Talleres Sport Club
        </p>
      </div>
    </footer>
  );
}

/**
 * Dados mockados do ADOPET. Edite aqui para adicionar/alterar pets e abrigos.
 * Fotos via loremflickr (placeholder), com "lock" para manter a mesma imagem.
 */
export type Species = "cao" | "gato";
export type Size = "pequeno" | "medio" | "grande";
export type Coat = "curto" | "medio" | "longo";
export type Sex = "macho" | "femea";

export interface Shelter {
  id: string;
  name: string;
  short: string;
  city: string;
  phone: string;
  avatar: string;
}

export interface Pet {
  id: string;
  name: string;
  species: Species;
  breed: string;
  ageYears: number; // fração para filhotes (ex: 0.5 = 6 meses)
  size: Size;
  coat: Coat;
  sex: Sex;
  vaccinated: boolean;
  dewormed: boolean;
  neutered: boolean;
  shelterId: string;
  personality: string;
  photos: string[];
}

const img = (kind: string, lock: number) => `https://loremflickr.com/480/480/${kind}?lock=${lock}`;

export const shelters: Shelter[] = [
  { id: "apc", name: "Abrigo Patinhas Cariocas", short: "Patinhas Cariocas", city: "Rio de Janeiro - RJ", phone: "(21) 99876-1234", avatar: img("puppy", 901) },
  { id: "maa", name: "Meus Amigos Animais", short: "Meus Amigos Animais", city: "Niterói - RJ", phone: "(21) 98765-4321", avatar: img("kitten", 902) },
  { id: "aea", name: "Abrigo Esperança Animal", short: "Esperança Animal", city: "Petrópolis - RJ", phone: "(24) 99123-4567", avatar: img("dog", 903) },
];

const p = (o: Omit<Pet, "photos"> & { lock: number }): Pet => {
  const kind = o.species === "cao" ? "dog" : "cat";
  const { lock, ...rest } = o;
  return { ...rest, photos: [img(kind, lock), img(kind, lock + 100), img(kind, lock + 200)] };
};

export const pets: Pet[] = [
  p({ id: "thor", name: "Thor", species: "cao", breed: "Vira-lata caramelo", ageYears: 3, size: "medio", coat: "curto", sex: "macho", vaccinated: true, dewormed: true, neutered: true, shelterId: "apc", personality: "Brincalhão, adora correr na praia e é ótimo com crianças. Aprende comandos rapidinho!", lock: 11 }),
  p({ id: "max", name: "Max", species: "cao", breed: "Labrador", ageYears: 5, size: "grande", coat: "curto", sex: "macho", vaccinated: true, dewormed: true, neutered: false, shelterId: "maa", personality: "Calmo e muito carinhoso. Gosta de longos passeios e de cochilar no sol.", lock: 12 }),
  p({ id: "luna", name: "Luna", species: "gato", breed: "SRD tigrada", ageYears: 2, size: "pequeno", coat: "curto", sex: "femea", vaccinated: true, dewormed: true, neutered: true, shelterId: "apc", personality: "Curiosa e independente, mas adora um colinho no fim do dia.", lock: 13 }),
  p({ id: "apolo", name: "Apolo", species: "cao", breed: "Pastor Alemão mix", ageYears: 4, size: "grande", coat: "medio", sex: "macho", vaccinated: true, dewormed: false, neutered: true, shelterId: "aea", personality: "Protetor e leal. Ideal para casa com quintal e tutor ativo.", lock: 14 }),
  p({ id: "mel", name: "Mel", species: "cao", breed: "Poodle mix", ageYears: 0.5, size: "pequeno", coat: "longo", sex: "femea", vaccinated: true, dewormed: true, neutered: false, shelterId: "maa", personality: "Filhote cheia de energia, ama brinquedos de pelúcia.", lock: 15 }),
  p({ id: "simba", name: "Simba", species: "gato", breed: "Laranja SRD", ageYears: 0.7, size: "pequeno", coat: "medio", sex: "macho", vaccinated: false, dewormed: true, neutered: false, shelterId: "aea", personality: "Filhote aventureiro, vive escalando tudo. Muito sociável.", lock: 16 }),
  p({ id: "nina", name: "Nina", species: "gato", breed: "Siamês mix", ageYears: 6, size: "pequeno", coat: "curto", sex: "femea", vaccinated: true, dewormed: true, neutered: true, shelterId: "maa", personality: "Tranquila e conversadeira. Perfeita para apartamento.", lock: 17 }),
  p({ id: "bob", name: "Bob", species: "cao", breed: "Beagle", ageYears: 8, size: "medio", coat: "curto", sex: "macho", vaccinated: true, dewormed: true, neutered: true, shelterId: "apc", personality: "Idoso dócil, faro apurado e muito amor para dar.", lock: 18 }),
  p({ id: "frida", name: "Frida", species: "gato", breed: "Persa mix", ageYears: 3, size: "medio", coat: "longo", sex: "femea", vaccinated: true, dewormed: false, neutered: true, shelterId: "aea", personality: "Elegante e carinhosa, gosta de ser escovada.", lock: 19 }),
  p({ id: "pipoca", name: "Pipoca", species: "cao", breed: "Vira-lata", ageYears: 0.4, size: "pequeno", coat: "medio", sex: "femea", vaccinated: false, dewormed: true, neutered: false, shelterId: "apc", personality: "Filhotinha alegre, se dá bem com outros cães e gatos.", lock: 20 }),
  p({ id: "zeus", name: "Zeus", species: "cao", breed: "Rottweiler mix", ageYears: 2, size: "grande", coat: "curto", sex: "macho", vaccinated: true, dewormed: true, neutered: false, shelterId: "maa", personality: "Grandão gentil, adora carinho na barriga.", lock: 21 }),
  p({ id: "amora", name: "Amora", species: "gato", breed: "Preta SRD", ageYears: 1.5, size: "pequeno", coat: "curto", sex: "femea", vaccinated: true, dewormed: true, neutered: true, shelterId: "apc", personality: "Brincalhona e ronronante. Traz muita sorte!", lock: 22 }),
];

export const cities = ["Rio de Janeiro - RJ", "Niterói - RJ", "São Gonçalo - RJ", "Duque de Caxias - RJ", "Nova Iguaçu - RJ", "Petrópolis - RJ", "Volta Redonda - RJ", "Campos dos Goytacazes - RJ", "Cabo Frio - RJ"];

export const getShelter = (id: string) => shelters.find((s) => s.id === id)!;
export const getPet = (id: string) => pets.find((x) => x.id === id);

export const formatAge = (y: number) => {
  if (y < 1) {
    const m = Math.max(1, Math.round(y * 12));
    return `${m} ${m === 1 ? "Mês" : "Meses"}`;
  }
  const n = Math.floor(y);
  return `${n} ${n === 1 ? "Ano" : "Anos"}`;
};

export const sizeLabel: Record<Size, string> = { pequeno: "Pequeno Porte", medio: "Porte Médio", grande: "Grande Porte" };
export const coatLabel: Record<Coat, string> = { curto: "Pelo Curto", medio: "Pelo Médio", longo: "Pelo Longo" };
export const sexLabel: Record<Sex, string> = { macho: "Macho", femea: "Fêmea" };

/** Respostas automáticas simuladas do abrigo. */
export function autoReply(text: string, pet?: Pet): string {
  const t = text.toLowerCase();
  const name = pet?.name ?? "nosso aumigo";
  if (/vacin|saúde|saude|castr|vermi/.test(t) && pet)
    return `${name} está ${pet.vaccinated ? "vacinado(a)" : "com a vacinação em andamento"}, ${pet.dewormed ? "vermifugado(a)" : "aguardando vermífugo"} e ${pet.neutered ? "castrado(a)" : "ainda não castrado(a)"}.`;
  if (/visit|conhecer|ver|quando|horár|horar/.test(t))
    return `Pode vir conhecer ${name}! Recebemos visitas de terça a sábado, das 10h às 16h. Quer agendar?`;
  if (/adot|processo|document|requisit/.test(t))
    return "Para adotar, pedimos RG, comprovante de residência e uma conversinha rápida. Tudo bem simples!";
  if (pet) return `${name} é assim: ${pet.personality} Quer saber mais alguma coisa?`;
  return "Obrigado pela mensagem! Em que podemos ajudar?";
}

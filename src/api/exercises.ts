// src/api/exercises.ts
const API_HOST = "exercisedb.p.rapidapi.com";
const API_KEY = "d85919843bmshfe501f29e8916c9p1b869fjsn379c9978ea3b";

const headers = {
  "x-rapidapi-host": API_HOST,
  "x-rapidapi-key": API_KEY,
};

export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  gifUrl: string;
}

export async function searchExercisesByName(name: string): Promise<Exercise[]> {
  if (!name) return [];
  const res = await fetch(`https://${API_HOST}/exercises/name/${encodeURIComponent(name)}`, { headers });
  if (!res.ok) throw new Error("Erro ao buscar exercícios por nome");
  return res.json();
}

export async function getBodyPartList(): Promise<string[]> {
  const res = await fetch(`https://${API_HOST}/exercises/bodyPartList`, { headers });
  if (!res.ok) throw new Error("Erro ao buscar grupos musculares");
  return res.json();
}

export async function getExercisesByBodyPart(bodyPart: string): Promise<Exercise[]> {
  const res = await fetch(`https://${API_HOST}/exercises/bodyPart/${encodeURIComponent(bodyPart)}`, { headers });
  if (!res.ok) throw new Error("Erro ao buscar exercícios do grupo muscular");
  return res.json();
}

export async function getExerciseById(id: string): Promise<Exercise> {
  const res = await fetch(`https://${API_HOST}/exercises/exercise/${encodeURIComponent(id)}`, { headers });
  if (!res.ok) throw new Error("Erro ao buscar exercício pelo ID");
  return res.json();
}

// Traduções de exercícios, partes do corpo e equipamentos
export const bodyPartTranslations: Record<string, string> = {
  'back': 'Costas',
  'cardio': 'Cardio',
  'chest': 'Peito',
  'lower arms': 'Antebraços',
  'lower legs': 'Panturrilhas',
  'neck': 'Pescoço',
  'shoulders': 'Ombros',
  'upper arms': 'Braços',
  'upper legs': 'Pernas',
  'waist': 'Abdômen',
};

export const equipmentTranslations: Record<string, string> = {
  'assisted': 'Assistido',
  'band': 'Elástico',
  'barbell': 'Barra',
  'body weight': 'Peso Corporal',
  'bosu ball': 'Bola Bosu',
  'cable': 'Cabo',
  'dumbbell': 'Haltere',
  'elliptical machine': 'Elíptico',
  'ez barbell': 'Barra EZ',
  'hammer': 'Martelo',
  'kettlebell': 'Kettlebell',
  'leverage machine': 'Máquina de Alavanca',
  'medicine ball': 'Bola Medicinal',
  'olympic barbell': 'Barra Olímpica',
  'resistance band': 'Faixa de Resistência',
  'roller': 'Rolo',
  'rope': 'Corda',
  'skierg machine': 'Máquina SkiErg',
  'sled machine': 'Máquina de Trenó',
  'smith machine': 'Smith Machine',
  'stability ball': 'Bola de Estabilidade',
  'stationary bike': 'Bicicleta Ergométrica',
  'stepmill machine': 'Máquina Step',
  'tire': 'Pneu',
  'trap bar': 'Barra Trap',
  'upper body ergometer': 'Ergômetro Superior',
  'weighted': 'Com Peso',
  'wheel roller': 'Roda',
};

export const targetMuscleTranslations: Record<string, string> = {
  'abs': 'Abdominais',
  'adductors': 'Adutores',
  'abductors': 'Abdutores',
  'biceps': 'Bíceps',
  'calves': 'Panturrilhas',
  'cardiovascular system': 'Sistema Cardiovascular',
  'delts': 'Deltoides',
  'forearms': 'Antebraços',
  'glutes': 'Glúteos',
  'hamstrings': 'Posteriores',
  'lats': 'Dorsais',
  'levator scapulae': 'Elevador da Escápula',
  'pectorals': 'Peitorais',
  'quads': 'Quadríceps',
  'serratus anterior': 'Serrátil Anterior',
  'spine': 'Coluna',
  'traps': 'Trapézio',
  'triceps': 'Tríceps',
  'upper back': 'Costas Superior',
};

export const translateBodyPart = (bodyPart: string): string => {
  return bodyPartTranslations[bodyPart.toLowerCase()] || bodyPart;
};

export const translateEquipment = (equipment: string): string => {
  return equipmentTranslations[equipment.toLowerCase()] || equipment;
};

export const translateTarget = (target: string): string => {
  return targetMuscleTranslations[target.toLowerCase()] || target;
};

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;

async function seedAdmin() {
  const email = 'test@gmail.com';
  const password = 'zxcv1234';

  const existing = await prisma.admin.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`Admin "${email}" already exists, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.admin.create({
    data: { email, passwordHash },
  });

  console.log(`Default admin created: ${email}`);
}

async function seedContent() {
  // --- Categories ---
  const categories = [
    {
      nameHr: 'Imenice',
      nameRu: 'Существительные',
      nameUk: 'Іменники',
      nameEn: 'Nouns',
      sortOrder: 1,
    },
    {
      nameHr: 'Pridjevi',
      nameRu: 'Прилагательные',
      nameUk: 'Прикметники',
      nameEn: 'Adjectives',
      sortOrder: 2,
    },
    {
      nameHr: 'Glagoli',
      nameRu: 'Глаголы',
      nameUk: 'Дієслова',
      nameEn: 'Verbs',
      sortOrder: 3,
    },
  ];

  const categoryRecords = [];
  for (const cat of categories) {
    const record = await prisma.category
      .upsert({
        where: { id: cat.nameEn },
        update: cat,
        create: { ...cat, id: undefined },
      })
      .catch(async () => {
        // upsert by id won't work for new records, use findFirst + create/update
        const existing = await prisma.category.findFirst({
          where: { nameEn: cat.nameEn },
        });
        if (existing) {
          return prisma.category.update({
            where: { id: existing.id },
            data: cat,
          });
        }
        return prisma.category.create({ data: cat });
      });
    categoryRecords.push(record);
  }

  console.log(`Seeded ${categoryRecords.length} categories`);

  // --- Word Sets ---
  const wordSetsData = [
    // Nouns
    {
      categoryName: 'Nouns',
      nameHr: 'Hrana',
      nameRu: 'Еда',
      nameUk: 'Їжа',
      nameEn: 'Food',
      sortOrder: 1,
    },
    {
      categoryName: 'Nouns',
      nameHr: 'Životinje',
      nameRu: 'Животные',
      nameUk: 'Тварини',
      nameEn: 'Animals',
      sortOrder: 2,
    },
    // Adjectives
    {
      categoryName: 'Adjectives',
      nameHr: 'Boje',
      nameRu: 'Цвета',
      nameUk: 'Кольори',
      nameEn: 'Colors',
      sortOrder: 1,
    },
    {
      categoryName: 'Adjectives',
      nameHr: 'Veličine',
      nameRu: 'Размеры',
      nameUk: 'Розміри',
      nameEn: 'Sizes',
      sortOrder: 2,
    },
    // Verbs
    {
      categoryName: 'Verbs',
      nameHr: 'Svakodnevne radnje',
      nameRu: 'Повседневные действия',
      nameUk: 'Щоденні дії',
      nameEn: 'Daily actions',
      sortOrder: 1,
    },
    {
      categoryName: 'Verbs',
      nameHr: 'Kretanje',
      nameRu: 'Движение',
      nameUk: 'Рух',
      nameEn: 'Movement',
      sortOrder: 2,
    },
  ];

  const wordSetRecords: Record<string, { id: string }> = {};
  for (const ws of wordSetsData) {
    const category = categoryRecords.find((c) => c.nameEn === ws.categoryName)!;
    const existing = await prisma.wordSet.findFirst({
      where: { nameEn: ws.nameEn, categoryId: category.id },
    });

    const wsData = {
      nameHr: ws.nameHr,
      nameRu: ws.nameRu,
      nameUk: ws.nameUk,
      nameEn: ws.nameEn,
      sortOrder: ws.sortOrder,
      categoryId: category.id,
    };

    const record = existing
      ? await prisma.wordSet.update({
          where: { id: existing.id },
          data: wsData,
        })
      : await prisma.wordSet.create({
          data: wsData,
        });

    wordSetRecords[ws.nameEn] = record;
  }

  console.log(`Seeded ${Object.keys(wordSetRecords).length} word sets`);

  // --- Words ---
  const wordsData = [
    // Food
    {
      wordSet: 'Food',
      baseForm: 'kruh',
      pluralForm: 'kruhovi',
      translationRu: 'хлеб',
      translationUk: 'хліб',
      translationEn: 'bread',
      sortOrder: 1,
    },
    {
      wordSet: 'Food',
      baseForm: 'mlijeko',
      pluralForm: null,
      translationRu: 'молоко',
      translationUk: 'молоко',
      translationEn: 'milk',
      sortOrder: 2,
    },
    {
      wordSet: 'Food',
      baseForm: 'jabuka',
      pluralForm: 'jabuke',
      translationRu: 'яблоко',
      translationUk: 'яблуко',
      translationEn: 'apple',
      sortOrder: 3,
    },
    {
      wordSet: 'Food',
      baseForm: 'sir',
      pluralForm: 'sirevi',
      translationRu: 'сыр',
      translationUk: 'сир',
      translationEn: 'cheese',
      sortOrder: 4,
    },
    {
      wordSet: 'Food',
      baseForm: 'voda',
      pluralForm: 'vode',
      translationRu: 'вода',
      translationUk: 'вода',
      translationEn: 'water',
      sortOrder: 5,
    },
    {
      wordSet: 'Food',
      baseForm: 'riba',
      pluralForm: 'ribe',
      translationRu: 'рыба',
      translationUk: 'риба',
      translationEn: 'fish',
      sortOrder: 6,
    },
    // Animals
    {
      wordSet: 'Animals',
      baseForm: 'pas',
      pluralForm: 'psi',
      translationRu: 'собака',
      translationUk: 'собака',
      translationEn: 'dog',
      sortOrder: 1,
    },
    {
      wordSet: 'Animals',
      baseForm: 'mačka',
      pluralForm: 'mačke',
      translationRu: 'кошка',
      translationUk: 'кішка',
      translationEn: 'cat',
      sortOrder: 2,
    },
    {
      wordSet: 'Animals',
      baseForm: 'ptica',
      pluralForm: 'ptice',
      translationRu: 'птица',
      translationUk: 'птах',
      translationEn: 'bird',
      sortOrder: 3,
    },
    {
      wordSet: 'Animals',
      baseForm: 'riba',
      pluralForm: 'ribe',
      translationRu: 'рыба',
      translationUk: 'риба',
      translationEn: 'fish',
      sortOrder: 4,
    },
    {
      wordSet: 'Animals',
      baseForm: 'konj',
      pluralForm: 'konji',
      translationRu: 'лошадь',
      translationUk: 'кінь',
      translationEn: 'horse',
      sortOrder: 5,
    },
    // Colors
    {
      wordSet: 'Colors',
      baseForm: 'crven',
      pluralForm: null,
      translationRu: 'красный',
      translationUk: 'червоний',
      translationEn: 'red',
      sortOrder: 1,
    },
    {
      wordSet: 'Colors',
      baseForm: 'plav',
      pluralForm: null,
      translationRu: 'синий',
      translationUk: 'синій',
      translationEn: 'blue',
      sortOrder: 2,
    },
    {
      wordSet: 'Colors',
      baseForm: 'zelen',
      pluralForm: null,
      translationRu: 'зелёный',
      translationUk: 'зелений',
      translationEn: 'green',
      sortOrder: 3,
    },
    {
      wordSet: 'Colors',
      baseForm: 'bijel',
      pluralForm: null,
      translationRu: 'белый',
      translationUk: 'білий',
      translationEn: 'white',
      sortOrder: 4,
    },
    {
      wordSet: 'Colors',
      baseForm: 'crn',
      pluralForm: null,
      translationRu: 'чёрный',
      translationUk: 'чорний',
      translationEn: 'black',
      sortOrder: 5,
    },
    // Sizes
    {
      wordSet: 'Sizes',
      baseForm: 'velik',
      pluralForm: null,
      translationRu: 'большой',
      translationUk: 'великий',
      translationEn: 'big',
      sortOrder: 1,
    },
    {
      wordSet: 'Sizes',
      baseForm: 'mali',
      pluralForm: null,
      translationRu: 'маленький',
      translationUk: 'малий',
      translationEn: 'small',
      sortOrder: 2,
    },
    {
      wordSet: 'Sizes',
      baseForm: 'visok',
      pluralForm: null,
      translationRu: 'высокий',
      translationUk: 'високий',
      translationEn: 'tall',
      sortOrder: 3,
    },
    {
      wordSet: 'Sizes',
      baseForm: 'nizak',
      pluralForm: null,
      translationRu: 'низкий',
      translationUk: 'низький',
      translationEn: 'short',
      sortOrder: 4,
    },
    {
      wordSet: 'Sizes',
      baseForm: 'širok',
      pluralForm: null,
      translationRu: 'широкий',
      translationUk: 'широкий',
      translationEn: 'wide',
      sortOrder: 5,
    },
    // Daily actions
    {
      wordSet: 'Daily actions',
      baseForm: 'jesti',
      pluralForm: null,
      translationRu: 'есть',
      translationUk: 'їсти',
      translationEn: 'to eat',
      sortOrder: 1,
    },
    {
      wordSet: 'Daily actions',
      baseForm: 'piti',
      pluralForm: null,
      translationRu: 'пить',
      translationUk: 'пити',
      translationEn: 'to drink',
      sortOrder: 2,
    },
    {
      wordSet: 'Daily actions',
      baseForm: 'spavati',
      pluralForm: null,
      translationRu: 'спать',
      translationUk: 'спати',
      translationEn: 'to sleep',
      sortOrder: 3,
    },
    {
      wordSet: 'Daily actions',
      baseForm: 'raditi',
      pluralForm: null,
      translationRu: 'работать',
      translationUk: 'працювати',
      translationEn: 'to work',
      sortOrder: 4,
    },
    {
      wordSet: 'Daily actions',
      baseForm: 'čitati',
      pluralForm: null,
      translationRu: 'читать',
      translationUk: 'читати',
      translationEn: 'to read',
      sortOrder: 5,
    },
    // Movement
    {
      wordSet: 'Movement',
      baseForm: 'ići',
      pluralForm: null,
      translationRu: 'идти',
      translationUk: 'йти',
      translationEn: 'to go',
      sortOrder: 1,
    },
    {
      wordSet: 'Movement',
      baseForm: 'trčati',
      pluralForm: null,
      translationRu: 'бежать',
      translationUk: 'бігти',
      translationEn: 'to run',
      sortOrder: 2,
    },
    {
      wordSet: 'Movement',
      baseForm: 'plivati',
      pluralForm: null,
      translationRu: 'плавать',
      translationUk: 'плавати',
      translationEn: 'to swim',
      sortOrder: 3,
    },
    {
      wordSet: 'Movement',
      baseForm: 'letjeti',
      pluralForm: null,
      translationRu: 'летать',
      translationUk: 'літати',
      translationEn: 'to fly',
      sortOrder: 4,
    },
    {
      wordSet: 'Movement',
      baseForm: 'hodati',
      pluralForm: null,
      translationRu: 'ходить',
      translationUk: 'ходити',
      translationEn: 'to walk',
      sortOrder: 5,
    },
  ];

  let wordCount = 0;
  for (const w of wordsData) {
    const wordSetRecord = wordSetRecords[w.wordSet];
    if (!wordSetRecord) continue;

    const wordData = {
      baseForm: w.baseForm,
      pluralForm: w.pluralForm,
      translationRu: w.translationRu,
      translationUk: w.translationUk,
      translationEn: w.translationEn,
      sortOrder: w.sortOrder,
      wordSetId: wordSetRecord.id,
    };

    const existing = await prisma.word.findFirst({
      where: { wordSetId: wordSetRecord.id, baseForm: w.baseForm },
    });

    const word = existing
      ? await prisma.word.update({
          where: { id: existing.id },
          data: wordData,
        })
      : await prisma.word.create({
          data: wordData,
        });

    // Exercise configs: FLASHCARDS for all words, JEDNINA_MNOZINA for words with pluralForm
    await prisma.wordExerciseConfig.createMany({
      data: [
        { wordId: word.id, exerciseType: 'FLASHCARDS' },
        ...(w.pluralForm ? [{ wordId: word.id, exerciseType: 'JEDNINA_MNOZINA' as const }] : []),
      ],
      skipDuplicates: true,
    });

    wordCount++;
  }

  console.log(`Seeded ${wordCount} words with exercise configs`);
}

async function main() {
  await seedAdmin();
  await seedContent();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

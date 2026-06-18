import "./load-env";
import bcrypt from "bcryptjs";
import {
  connectDb,
  disconnectDb,
  getDb,
  usersRepo,
  categoriesRepo,
  productsRepo,
} from "./index";

async function seed() {
  await connectDb();

  const existingAdmin = await usersRepo.findUserByEmail("admin@drip.store");
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("password", 10);
    await usersRepo.createUser({
      name: "Admin",
      email: "admin@drip.store",
      passwordHash,
      role: "admin",
      emailVerified: true,
    });
    console.log("Created admin user: admin@drip.store / password");
  } else {
    console.log("Admin user already exists");
  }

  const categories = await categoriesRepo.listCategories();
  const existingTees = categories.find((category) => category.slug === "t-shirts");
  const existingTrousers = categories.find((category) => category.slug === "trousers");

  const tees =
    existingTees ??
    (await categoriesRepo.createCategory({
      name: "T-Shirts",
      slug: "t-shirts",
      description: "Graphic tees and basics",
    }));

<<<<<<< HEAD
  const trousers =
    existingTrousers ??
    (await categoriesRepo.createCategory({
      name: "Trousers",
      slug: "trousers",
      description: "Casual trousers and joggers",
    }));
=======
    const sampleProducts = [
      {
        title: "DRIP Oversized Hoodie — Black",
        description: "Heavyweight cotton blend hoodie with embroidered logo.",
        price: 8999,
        compareAtPrice: 11000,
        category: "Hoodies",
        categoryId: hoodies.id,
        images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"],
        stock: 50,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Black"],
        tags: ["hoodie", "streetwear"],
        featured: true,
      },
      {
        title: "DRIP Logo Tee — White",
        description: "Premium cotton tee with minimal DRIP branding.",
        price: 3999,
        category: "T-Shirts",
        categoryId: tees.id,
        images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"],
        stock: 100,
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["White"],
        tags: ["tee", "basics"],
        featured: true,
      },
      {
        title: "Cargo Pants — Olive",
        description: "Relaxed fit cargo pants with multiple pockets.",
        price: 7999,
        compareAtPrice: 9500,
        category: "Pants",
        categoryId: pants.id,
        images: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800"],
        stock: 30,
        sizes: ["28", "30", "32", "34", "36"],
        colors: ["Olive"],
        tags: ["pants", "cargo"],
        featured: true,
      },
      {
        title: "DRIP Hoodie — Heather Grey",
        description: "Soft fleece hoodie in heather grey.",
        price: 8499,
        category: "Hoodies",
        categoryId: hoodies.id,
        images: ["https://images.unsplash.com/photo-1578583451327-19b2b7821117?w=800"],
        stock: 40,
        sizes: ["S", "M", "L", "XL"],
        colors: ["Grey"],
        tags: ["hoodie"],
        featured: false,
      },
    ];
>>>>>>> 76338c17e7b6863973759898537571a6d9815001

  await getDb()
    .collection("categories")
    .deleteMany({ slug: { $in: ["hoodies", "bottoms", "pants"] } });
  await getDb()
    .collection("products")
    .deleteMany({ category: { $in: ["Hoodies", "Bottoms", "Pants"] } });
  await getDb()
    .collection("products")
    .updateMany(
      { category: "T-Shirts" },
      { $set: { price: 1500, compareAtPrice: null, categoryId: tees.id, updatedAt: new Date() } },
    );
  await getDb()
    .collection("products")
    .updateMany(
      { category: "Trousers" },
      { $set: { price: 1500, compareAtPrice: null, categoryId: trousers.id, updatedAt: new Date() } },
    );

  const sampleProducts = [
    {
      title: "DRIP Logo Tee - White",
      description: "Premium cotton tee with minimal DRIP branding.",
      price: 1500,
      compareAtPrice: null,
      category: "T-Shirts",
      categoryId: tees.id,
      images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"],
      stock: 100,
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["White"],
      tags: ["tee", "basics"],
      featured: true,
    },
    {
      title: "DRIP Trouser - Olive",
      description: "Relaxed fit trouser with a clean streetwear cut.",
      price: 1500,
      compareAtPrice: null,
      category: "Trousers",
      categoryId: trousers.id,
      images: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800"],
      stock: 50,
      sizes: ["28", "30", "32", "34", "36"],
      colors: ["Olive"],
      tags: ["trouser", "streetwear"],
      featured: true,
    },
  ];

  for (const product of sampleProducts) {
    const existingProduct = await getDb()
      .collection("products")
      .findOne({ category: product.category });

    if (existingProduct) {
      await productsRepo.updateProduct(existingProduct.id as number, product);
    } else {
      await productsRepo.createProduct(product);
    }
  }

  console.log("Seeded T-Shirts and Trousers products at PKR 1500");

  await disconnectDb();
  console.log("Seed complete");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

import "./load-env";
import bcrypt from "bcryptjs";
import { connectDb, disconnectDb, usersRepo, categoriesRepo, productsRepo } from "./index";

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
  if (categories.length === 0) {
    const hoodies = await categoriesRepo.createCategory({
      name: "Hoodies",
      slug: "hoodies",
      description: "Premium streetwear hoodies",
    });
    const tees = await categoriesRepo.createCategory({
      name: "T-Shirts",
      slug: "t-shirts",
      description: "Graphic tees and basics",
    });
    const pants = await categoriesRepo.createCategory({
      name: "Pants",
      slug: "pants",
      description: "Cargo pants and joggers",
    });

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

    for (const product of sampleProducts) {
      await productsRepo.createProduct(product);
    }
    console.log(`Seeded ${sampleProducts.length} sample products`);
  } else {
    console.log("Categories already exist, skipping product seed");
  }

  await disconnectDb();
  console.log("Seed complete");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

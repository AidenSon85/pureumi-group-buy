import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { subDays } from "date-fns";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 시드 데이터 생성 시작...");

  // 카테고리
  const categories = await Promise.all([
    prisma.category.upsert({ where: { id: "cat-1" }, update: {}, create: { id: "cat-1", name: "신선식품", sortOrder: 1 } }),
    prisma.category.upsert({ where: { id: "cat-2" }, update: {}, create: { id: "cat-2", name: "가공식품", sortOrder: 2 } }),
    prisma.category.upsert({ where: { id: "cat-3" }, update: {}, create: { id: "cat-3", name: "생활용품", sortOrder: 3 } }),
  ]);

  // 매장
  const factories = await Promise.all([
    prisma.factory.upsert({ where: { code: "GUNAM" }, update: {}, create: { id: "factory-1", name: "구남점", code: "GUNAM", address: "서울시 강남구 구남로 123", phone: "02-1234-5678" } }),
    prisma.factory.upsert({ where: { code: "SEOCHO" }, update: {}, create: { id: "factory-2", name: "서초점", code: "SEOCHO", address: "서울시 서초구 서초대로 456", phone: "02-9876-5432" } }),
    prisma.factory.upsert({ where: { code: "MAPO" }, update: {}, create: { id: "factory-3", name: "마포점", code: "MAPO", address: "서울시 마포구 마포대로 789", phone: "02-5555-5555" } }),
  ]);

  // 관리자 계정
  const adminPw = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { email: "admin@pureumi.com" },
    update: {},
    create: { email: "admin@pureumi.com", password: adminPw, name: "관리자", role: "ADMIN" },
  });

  // 매니저 계정
  const mgrPw = await bcrypt.hash("manager123", 10);
  await prisma.user.upsert({
    where: { email: "manager@pureumi.com" },
    update: {},
    create: { email: "manager@pureumi.com", password: mgrPw, name: "구남 매니저", role: "MANAGER", factoryId: "factory-1" },
  });

  // 고객 계정 5명
  const custPw = await bcrypt.hash("customer123", 10);
  const customers = [];
  for (let i = 1; i <= 5; i++) {
    const c = await prisma.user.upsert({
      where: { email: `customer${i}@test.com` },
      update: {},
      create: {
        email: `customer${i}@test.com`, password: custPw, name: `고객${i}`,
        phone: `010-${String(1000 + i).padStart(4, "0")}-${String(5678 + i).padStart(4, "0")}`,
        role: "CUSTOMER", factoryId: factories[i % factories.length].id,
      },
    });
    customers.push(c);
  }

  // 제품 등록
  const productData = [
    { name: "프리미엄 한우 불고기", price: 35000, salePrice: 29900, stock: 50, unit: "300g", categoryId: "cat-1", factoryId: "factory-1" },
    { name: "제주 갈치 조림 세트", price: 28000, stock: 30, unit: "팩", categoryId: "cat-1", factoryId: "factory-1" },
    { name: "국내산 참기름", price: 12000, salePrice: 9900, stock: 100, unit: "500ml", categoryId: "cat-2", factoryId: "factory-1" },
    { name: "유기농 현미", price: 18000, stock: 80, unit: "2kg", categoryId: "cat-2", factoryId: "factory-2" },
    { name: "천연 꿀 세트", price: 45000, salePrice: 39000, stock: 25, unit: "세트", categoryId: "cat-2", factoryId: "factory-2" },
    { name: "친환경 주방세제", price: 8500, stock: 150, unit: "개", categoryId: "cat-3", factoryId: "factory-2" },
    { name: "한방 샴푸", price: 22000, stock: 60, unit: "개", categoryId: "cat-3", factoryId: "factory-3" },
    { name: "국산 김치 2kg", price: 25000, salePrice: 22000, stock: 40, unit: "2kg", categoryId: "cat-1", factoryId: "factory-3" },
  ];

  const products = [];
  for (const p of productData) {
    const existing = await prisma.product.findFirst({ where: { name: p.name, factoryId: p.factoryId } });
    if (!existing) {
      const created: Awaited<ReturnType<typeof prisma.product.create>> = await prisma.product.create({
        data: { ...p, minQty: 1, sortOrder: products.length, description: `${p.name} 상품입니다.` },
      });
      products.push(created);
    } else {
      products.push(existing);
    }
  }

  // 주문 데이터 (30일치)
  let orderSeq = 1000;
  for (let day = 29; day >= 0; day--) {
    const date = subDays(new Date(), day);
    const ordersPerDay = Math.floor(Math.random() * 5) + 2;

    for (let j = 0; j < ordersPerDay; j++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const factory = factories[Math.floor(Math.random() * factories.length)];
      const factoryProducts = products.filter((p) => p.factoryId === factory.id);
      if (factoryProducts.length === 0) continue;

      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = factoryProducts.slice(0, numItems);
      let totalAmount = 0;
      const items = selectedProducts.map((p) => {
        const qty = Math.floor(Math.random() * 3) + 1;
        const price = p.salePrice || p.price;
        const amount = qty * price;
        totalAmount += amount;
        return { productId: p.id, quantity: qty, price, amount };
      });

      await prisma.order.create({
        data: {
          orderNo: `ORD${String(orderSeq++).padStart(6, "0")}`,
          userId: customer.id, factoryId: factory.id,
          totalAmount, status: day > 5 ? "DELIVERED" : day > 2 ? "CONFIRMED" : "PENDING",
          orderedAt: date,
          items: { create: items },
        },
      });

      // DailyStat 업데이트
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      await prisma.dailyStat.upsert({
        where: { factoryId_date: { factoryId: factory.id, date: dateOnly } },
        update: {
          salesAmount: { increment: totalAmount },
          orderCount: { increment: 1 },
          visitorCount: { increment: Math.floor(Math.random() * 3) + 1 },
        },
        create: {
          factoryId: factory.id, date: dateOnly,
          salesAmount: totalAmount, orderCount: 1,
          visitorCount: Math.floor(Math.random() * 10) + 5,
        },
      });
    }
  }

  console.log("✅ 시드 데이터 생성 완료!");
  console.log("📧 관리자 계정: admin@pureumi.com / admin1234");
  console.log("📧 매니저 계정: manager@pureumi.com / manager123");
}

main().catch(console.error).finally(() => prisma.$disconnect());

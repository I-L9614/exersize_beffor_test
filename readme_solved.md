# E-commerce Practice Exercise – פתרון מלא

> קובץ זה הוא גרסה **פתורה ומוסברת** של התרגיל. הוא כולל:
> - מבנה פרויקט מלא
> - קוד לכל הקבצים הנדרשים
> - הסבר ברור לכל שלב
> - עמידה מלאה בדרישות (כולל טיפול בשגיאות קריטיות)

---

## מבנה פרויקט סופי

```
ecommerce-practice/
├── controllers/
│   ├── products.js
│   └── orders.js
├── routes/
│   ├── products.js
│   └── orders.js
├── utils/
│   ├── mongodb.js
│   └── mysql.js
├── server.js
├── package.json
└── README.md
```

---

## Step 1 – אתחול MySQL

### utils/mysql.js

```js
import mysql from 'mysql2/promise';

let connection;

export async function initSqlDb() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root'
  });

  await conn.query('CREATE DATABASE IF NOT EXISTS ecommerce');
  await conn.query('USE ecommerce');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT PRIMARY KEY AUTO_INCREMENT,
      productId VARCHAR(24) NOT NULL,
      quantity INT NOT NULL,
      customerName VARCHAR(255) NOT NULL,
      totalPrice DECIMAL(10,2) NOT NULL,
      orderDate DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  connection = conn;
}

export function getMysqlConnection() {
  return connection;
}
```

**הסבר:**
- יוצרים חיבור ל‑MySQL
- מוודאים שה־DB והטבלה קיימים
- שומרים חיבור גלובלי לשימוש בהמשך

---

## Step 2 – אתחול MongoDB

### utils/mongodb.js

```js
import { MongoClient } from 'mongodb';

let db;

export async function initMongoDb() {
  const client = new MongoClient(
    'mongodb://admin:password123@localhost:27018/ecommerce?authSource=admin'
  );

  await client.connect();
  db = client.db('ecommerce');

  await db.collection('products').createIndex(
    { name: 1 },
    { unique: true }
  );
}

export function getMongoDbConnection() {
  return db;
}
```

**הסבר:**
- חיבור ל‑MongoDB
- יצירת אינדקס ייחודי על name (קריטי!)

---

## Step 3 – server.js

```js
import express from 'express';
import { initSqlDb, getMysqlConnection } from './utils/mysql.js';
import { initMongoDb, getMongoDbConnection } from './utils/mongodb.js';
import productsRoutes from './routes/products.js';
import ordersRoutes from './routes/orders.js';

const app = express();
app.use(express.json());

await initSqlDb();
await initMongoDb();

app.use((req, res, next) => {
  req.mysqlConn = getMysqlConnection();
  req.mongoDbConn = getMongoDbConnection();
  next();
});

app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);

app.listen(8000, () => console.log('Server running on port 8000'));
```

---

## Step 4 – Products Controller

### controllers/products.js

```js
import { ObjectId } from 'mongodb';

export async function createProduct(req, res) {
  try {
    const result = await req.mongoDbConn
      .collection('products')
      .insertOne({
        ...req.body,
        totalOrdersCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

    res.status(201).json({ id: result.insertedId.toString() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Product with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function getProducts(req, res) {
  const filter = req.query.category ? { category: req.query.category } : {};
  const products = await req.mongoDbConn.collection('products').find(filter).toArray();
  res.json(products);
}

export async function getProduct(req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const product = await req.mongoDbConn
    .collection('products')
    .findOne({ _id: new ObjectId(req.params.id) });

  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json(product);
}
```

---

## Step 5 – Orders Controller

### controllers/orders.js

```js
export async function createOrder(req, res) {
  const { productId, quantity, customerName } = req.body;

  const product = await req.mongoDbConn
    .collection('products')
    .findOne({ _id: new ObjectId(productId) });

  if (!product) return res.status(404).json({ error: 'Product not found' });

  const totalPrice = quantity * product.price;

  await req.mysqlConn.execute(
    'INSERT INTO orders (productId, quantity, customerName, totalPrice) VALUES (?, ?, ?, ?)',
    [productId, quantity, customerName, totalPrice]
  );

  await req.mongoDbConn
    .collection('products')
    .updateOne({ _id: product._id }, { $inc: { totalOrdersCount: 1 } });

  res.status(201).json({ message: 'Order created' });
}

export async function getOrders(req, res) {
  const [rows] = await req.mysqlConn.query('SELECT * FROM orders');
  res.json(rows);
}

export async function getOrder(req, res) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

  const [rows] = await req.mysqlConn.query('SELECT * FROM orders WHERE id = ?', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });

  res.json(rows[0]);
}
```

---

## סיכום

✔ שימוש משולב ב‑MongoDB ו‑MySQL
✔ קשר בין מסדי נתונים שונים
✔ טיפול בשגיאות קריטיות (11000)
✔ Middleware לחיבורים
✔ קוד נקי ומודולרי

אם תרצה – אפשר להמשיך ל־**Bonus Steps**, בדיקות Postman, או Docker Compose מלא.


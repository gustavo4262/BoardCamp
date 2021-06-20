import express from "express";
import cors from "cors";
import pg from "pg";
import { categoriesSchema, gameSchema, customerSchema } from "./schemas.js";

const { Pool } = pg;

const connection = new Pool({
  user: "bootcamp_role",
  password: "senha_super_hiper_ultra_secreta_do_role_do_bootcamp",
  host: "localhost",
  port: 5432,
  database: "boardcamp",
});

const app = express();
app.use(express.json());
app.use(cors());

app.get("/categories", async (req, res) => {
  const result = await connection.query("SELECT * FROM categories");
  res.status(200).send(result.rows);
});

app.post("/categories", async (req, res) => {
  try {
    const categoryName = req.body.name;
    await categoriesSchema.validateAsync({ name: categoryName });
    const result = await connection.query(
      "SELECT * from categories WHERE name = $1",
      [categoryName]
    );
    if (result.rows.length) {
      res.sendStatus(409);
    } else {
      await connection.query("INSERT INTO categories (name) VALUES ($1)", [
        categoryName,
      ]);
      return res.sendStatus(201);
    }
  } catch (err) {
    res.sendStatus(400);
  }
});

app.get("/games", async (req, res) => {
  const { name } = req.query;
  console.log(`${name}%`, req.query);
  if (name) {
    const result = await connection.query(
      `SELECT g.*, c.name as "categoryName" FROM (SELECT * FROM games WHERE games.name like $1) as g JOIN categories as c ON g."categoryId" = c.id;`,
      [`${name.charAt(0).toUpperCase() + name.slice(1)}%`]
    );
    console.log(result.command);
    res.status(200).send(result.rows);
  } else {
    const result = await connection.query(
      'SELECT g.*, c.name as "categoryName" FROM games AS g JOIN categories AS c ON g."categoryId" = c.id'
    );
    res.status(200).send(result.rows);
  }
});

app.post("/games", async (req, res) => {
  let { name, image, stockTotal, categoryId, pricePerDay } = req.body;
  name = name.charAt(0).toUpperCase() + name.slice(1);
  try {
    await gameSchema.validateAsync({
      name,
      image,
      stockTotal,
      categoryId,
      pricePerDay,
    });
    const categoriesQuery = await connection.query(
      "SELECT * FROM categories WHERE categories.id = $1",
      [categoryId]
    );
    if (categoriesQuery.rows.length) {
      const nameQuery = await connection.query(
        "SELECT * FROM games WHERE name = $1",
        [name]
      );
      if (nameQuery.rows.length) {
        return res.sendStatus(409);
      } else {
        await connection.query(
          'INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)',
          [name, image, stockTotal, categoryId, pricePerDay]
        );
        return res.sendStatus(201);
      }
    } else {
      console.log(categoriesQuery.rows);
      return res.sendStatus(400);
    }
  } catch (err) {
    console.log(err);
    return res.sendStatus(400);
  }
});

app.get("/customers", async (req, res) => {
  const { cpf } = req.query;
  if (cpf) {
    const result = await connection.query(
      "SELECT * FROM customers WHERE cpf like $1",
      [`${cpf}%`]
    );
    return res.status(200).send(result);
  } else {
    const result = await connection.query("SELECT * FROM customers");
    return res.status(200).send(result);
  }
});

app.get("/customers/:id", async (req, res) => {
  const { id } = req.params;
  const result = await connection.query(
    "SELECT * FROM customers WHERE id = $1",
    [id]
  );
  if (result.rows.length) {
    return res.status(200).send(result);
  } else {
    return res.status(404);
  }
});

app.post("/customers", async (req, res) => {
  const { name, phone, cpf, birthday } = req.body;
  try {
    await customerSchema.validateAsync({ name, phone, cpf, birthday });
    const cpfQuery = await connection.query(
      "SELECT * FROM customers WHERE cpf = $1",
      [cpf]
    );
    if (cpfQuery.rows.length) {
      return res.sendStatus(409);
    } else {
      await connection.query(
        "INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)",
        [name, phone, cpf, birthday]
      );
      res.sendStatus(201);
    }
  } catch (err) {
    res.sendStatus(400);
  }
});

app.put("/customers/:id", async (req, res) => {
  const { name, phone, cpf, birthday } = req.body;
  try {
    await customerSchema.validateAsync({ name, phone, cpf, birthday });
    const cpfQuery = await connection.query(
      "SELECT * FROM customers WHERE cpf = $1",
      [cpf]
    );
    if (!cpfQuery.rows.length) {
      return res.sendStatus(409);
    } else {
      await connection.query(
        "UPDATE customers SET name = $1 and phone = $2 where cpf=$3",
        [name, phone, cpf]
      );
      res.sendStatus(201);
    }
  } catch (err) {
    res.sendStatus(400);
  }
});

app.listen(4000, () => {
  console.log("Listening on port 4000");
});

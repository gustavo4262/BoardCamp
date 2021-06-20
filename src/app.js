import express from "express";
import cors from "cors";
import pg from "pg";
import { categoriesSchema } from "./schemas.js";

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

app.listen(4000, () => {
  console.log("Listening on port 4000");
});

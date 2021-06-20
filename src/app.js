import express, { query } from "express";
import cors from "cors";
import pg from "pg";
import {
  categoriesSchema,
  gameSchema,
  customerSchema,
  rentalSchema,
} from "./schemas.js";

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
        "UPDATE customers SET name = $1 AND phone = $2 WHERE cpf = $3",
        [name, phone, cpf]
      );
      res.sendStatus(201);
    }
  } catch (err) {
    res.sendStatus(400);
  }
});

app.get("/rentals", async (req, res) => {
  const { customerId, gameId } = req.query;
  if (customerId) {
    const rentalsQuery = await connection.query(
      'SELECT * FROM rentals WHERE "customerId" = $1',
      [customerId]
    );
  } else if (gameId) {
    const rentalsQuery = await connection.query(
      'SELECT * FROM rentals WHERE "gameId" = $1',
      [gameId]
    );
  } else {
    const rentalsQuery = await connection.query("SELECT * FROM rentals");
  }
  let resp = [];
  rentalsQuery.rows.forEach(async (row) => {
    const rentalCustomerId = row.customerId;
    const rentalGameId = row.gameId;
    const customer = (
      await connection.query("SELECT id, name FROM customers WHERE id = $1", [
        rentalCustomerId,
      ])
    ).rows;
    const game = (
      await connection.query(
        'SELECT g.id AS id, g.name AS name , g."categoryId" AS "categoryId", c.name as "categoryName" FROM games as g JOIN categories as c ON g."categoryId" = c.id WHERE g.id = $1',
        [rentalGameId]
      )
    ).rows;
    let respRow = row;
    respRow.customer = customer;
    respRow.game = game;
    resp.push(respRow);
  });
  res.status(200).send(resp);
});

app.post("/rentals", async (req, res) => {
  const { customerId, gameId, daysRented } = req.body;
  try {
    rentalSchema.validateAsync({ customerId, gameId, daysRented });
    const customerQuery = await connection.query(
      "SELECT * from customers WHERE id = $1",
      [customerId]
    );
    if (!customerQuery.rowCount) {
      throw TypeError;
    }
    const rentsGame = (
      await connection.query(
        'SELECT COUNT(*) as total FROM customers WHERE "gameId" = $1',
        [gameId]
      )
    ).rows[0].total;
    const stockGame = (
      await connection.query('SELECT "stockTotal" FROM games WHERE id = $1', [
        gameId,
      ])
    ).rows[0].stockTotal;
    if (rentsGame === stockGame) {
      throw TypeError;
    }
    const gameQuery = await connection.query(
      "SELECT * FROM games WHERE id = $1",
      [gameId]
    );
    if (!gameQuery.rowCount) {
      throw TypeError;
    }
    const gamePriceQuery = await connection.query(
      'SELECT "pricePerDay" FROM games WHERE id = $1',
      [gameId]
    );
    const gamePrice = gamePriceQuery.rows[0].pricePerDay;
    const rentDate = new Date().toISOString().slice(0, 10);
    const daysRented = daysRented;
    const returnDate = null;
    const originalPrice = daysRented * gamePrice;
    const delayFee = null;
    await connection.query(
      'INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7) ',
      [
        customerId,
        gameId,
        rentDate,
        daysRented,
        returnDate,
        originalPrice,
        delayFee,
      ]
    );
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    return res.sendStatus(400);
  }
});

app.post("/rentals/:id/return", async (req, res) => {
  const { id } = req.params;
  const query = await connection.query("SELECT * FROM rentals WHERE id = $1", [
    id,
  ]);
  if (!query.rowCount) {
    return res.sendStatus(404);
  }
  if (!query.rows[0].returnDate) {
    res.sendStatus(400);
  }
  const returnDate = new Date().toISOString().slice(0, 10);
  let delayFee = null;
  const { rentDate, daysRented } = query.rows[0];
  const returnDays = Math.floor(
    (new Date() - rentDate) / (1000 * 60 * 60 * 24)
  );
  if (returnDays > daysRented) {
    const gamePriceQuery = await connection.query(
      'SELECT "pricePerDay" FROM games WHERE id in (SELECT "gameId" FROM rentals WHERE "gameId" = $1)',
      [id]
    );
    const gamePrice = gamePriceQuery.rows[0].pricePerDay;
    delayFee = (returnDays - daysRented) * gamePrice;
  }
  await connection.query(
    'UPDATE rentals SET "returnDate" = $1 and "delayFee" = $2 WHERE id = $3',
    [returnDate, delayFee, id]
  );
  res.sendStatus(200);
});

app.delete("/rentals/:id", async (req, res) => {
  const { id } = req.params;
  const query = await connection.query("SELECT * FROM rentals WHERE id = $1", [
    id,
  ]);
  if (query.rowCount) {
    return res.sendStatus(404);
  } else if (query.rows[0].returnDate) {
    return res.sendStatus(400);
  } else {
    await connection.query("DELETE FROM rentals WHERE id = $1", [id]);
    res.sendStatus(200);
  }
});

app.listen(4000, () => {
  console.log("Listening on port 4000");
});

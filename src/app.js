import express from "express";
import cors from "cors";
import pg from "pg";

const app = express();
app.use(cors());

app.listen(4000, () => {
  console.log("Listening on port 4000");
});

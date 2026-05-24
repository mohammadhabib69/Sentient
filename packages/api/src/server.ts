import "dotenv/config";
import { createApiServer } from "./index";

const port = Number(process.env.PORT ?? 4000);
const app = createApiServer();

app.listen(port, () => {
  console.log(`Sentient API listening on http://localhost:${port}`);
});

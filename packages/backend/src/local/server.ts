import "dotenv/config";
import { app } from "../app";

const port = 3001;
app.listen(port, () => {
  console.log(`Backend local server running on http://localhost:${port}`);
});

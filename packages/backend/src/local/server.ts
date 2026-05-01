import "dotenv/config";
import { app } from "../app";

const port = 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend local server running on http://localhost:${port}`);
});

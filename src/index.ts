import express from 'express';
import cors from 'cors';
import proposalRoutes from './routes/proposals';
import discussionRoutes from './routes/discussions';
import getRingRoutes from './routes/getRing';

const app = express();
const port = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());

app.use('/api', proposalRoutes);
app.use('/api', discussionRoutes);
app.use('/api', getRingRoutes);


app.get('/', (req, res) => {
  res.send('Api is up and running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
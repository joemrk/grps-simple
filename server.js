import { join } from 'path';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import express from 'express';

const __dirname = join(import.meta.url.slice(5), '..');

const STATUSES = {
  0: 'NEW',
  1: 'QUEUED',
  2: 'PROCESSING',
  3: 'DONE'
};

const DEGREE_PROTO_PATH = join(__dirname, 'protos', 'degree.proto');
const DEGREE_SERVICE_URL = '0.0.0.0:50051';

const PROCESSING_PROTO_PATH = join(__dirname, 'protos', 'processing.proto');
const PROCESSING_SERVICE_URL = '0.0.0.0:50052';

const degreePackageDefinition = protoLoader.loadSync(DEGREE_PROTO_PATH);
const degreeProto = grpc.loadPackageDefinition(degreePackageDefinition);

const processingPackageDefinition = protoLoader.loadSync(PROCESSING_PROTO_PATH);
const processingProto = grpc.loadPackageDefinition(processingPackageDefinition);

const degreeService = new degreeProto.Degrees(DEGREE_SERVICE_URL, grpc.credentials.createInsecure());
const processingService = new processingProto.Processing(PROCESSING_SERVICE_URL, grpc.credentials.createInsecure());

const app = express();
app.use(express.json());

const PORT = 3000;

const orders = new Map();

function onboard(order) {
  degreeService.find({ id: order.degreeId }, (err, degree) => {
    if(err) {
      console.error(err);
      return;
    }
    orders.set(order.id, degree);

    const call = processingService.process({
      orderId: order.id,
      degreeId: order.degreeId
    });

    call.on('data', (data) => {
      const savedOrder = orders.get(order.id);
      orders.set(order.id, {
        ...savedOrder,
        status: STATUSES[data.status]
      });
    });

  });
}

app.post('/orders', (req, res) => {
  const order = req.body;

  const orderId = orders.size + 1;
  Object.assign(order, { id: orderId });
  Object.assign(order, { createdAt: new Date().toISOString() });

  orders.set(orderId, order);

  onboard(order);
  res.json(order);
});

app.get('/status/:id', (req, res) => {
  const id = Number(req.params.id);
  const order = orders.get(id);
  res.json(order);
});


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
})
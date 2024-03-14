import { join } from 'path';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const __dirname = join(import.meta.url.slice(5), '..');

const PROTO_PATH = join(__dirname, 'protos', 'processing.proto');
const SERVICE_URL = '0.0.0.0:50052';

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const processingProto = grpc.loadPackageDefinition(packageDefinition);

function process(call) {
  const onboardRequest = call.request;
  const time = onboardRequest.orderId * 1000 + onboardRequest.degreeId * 10;
  call.write({ status: 0 });
  call.write({ status: 1 });

  setTimeout(() => {
    call.write({ status: 2 });
    setTimeout(() => {
      call.write({ status: 3 });
      call.end();
    }, time);
  }, time)
}

const server = new grpc.Server();
server.addService(processingProto.Processing.service, { process });
server.bindAsync(SERVICE_URL, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`server is running at ${SERVICE_URL}`);
  }
)
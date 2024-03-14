import { join } from 'path';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const __dirname = join(import.meta.url.slice(5), '..');

const PROTO_PATH = join(__dirname, 'protos', 'degree.proto');
const SERVICE_URL = '0.0.0.0:50051';

const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const degreeProto = grpc.loadPackageDefinition(packageDefinition);

const DEGREE = [
  { id: 1, name: 'Bachelor', major: 'Computer Science'},
  { id: 2, name: 'Master', major: 'Computer Science'},
  { id: 3, name: 'Doctor', major: 'Computer Science'},
];

function findDegree(call, callback) {
  const { id } = call.request;
  const degree = DEGREE.find((d) => d.id === id);
  if (degree) {
    callback(null, degree);
  } else {
    callback({
      code: grpc.status.NOT_FOUND,
      details: 'Not found'
    });
  }
}

const server = new grpc.Server();
server.addService(degreeProto.Degrees.service, { find: findDegree });
server.bindAsync(SERVICE_URL, grpc.ServerCredentials.createInsecure(), () => {
  // server.start();
  console.log(`server is running at ${SERVICE_URL}`);
})
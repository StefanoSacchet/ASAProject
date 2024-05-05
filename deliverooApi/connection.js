import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

export const client = new DeliverooApi(
    "http://localhost:8080",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU0MjBhZjRmODAyIiwibmFtZSI6InN0ZSIsImlhdCI6MTcxNDU3ODQ1OX0.j6hv5sWvFWNduAsDLNX9IOo7Wwh-72TBljYmu-IGupQ"
);

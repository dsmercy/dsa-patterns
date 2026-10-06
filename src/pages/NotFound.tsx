import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";

export function NotFound() {
  return (
    <Layout>
      <header className="hero"><h1>Problem not found</h1><Link className="btn" to="/">Back to all problems</Link></header>
    </Layout>
  );
}

import React from "react";
import { Outlet } from "react-router-dom";
import { Layout } from "antd";
import Header from "./components/header";

const OutletLayout = () => {
  const example = 1

  console.log(example)

  return (
    <Layout style={{ minHeight: "100vh", padding: 24, textAlign: "center", display: "flex", justifyContent: "center" }}>
      <Header />
      <Outlet />
      <footer></footer>
    </Layout>
  );
};

export default OutletLayout;
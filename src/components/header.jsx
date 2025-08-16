import React from "react"
import { Tabs } from "antd"
import { useNavigate } from "react-router-dom"

const Header = () => {
  const navigate = useNavigate()

  const onChange = (key) => {
    if (key === "1") navigate("/")
    else navigate("/card")
  }

  const items = [
    {
      key: "1",
      label: "Форма",
    },
    {
      key: "2",
      label: "Доска с карточками",
    },
  ]

  return (
    <Tabs
      defaultActiveKey={window.location.pathname === "/" ? "1" : "2"}
      items={items}
      onChange={onChange}
      centered
    />
  )
}

export default Header

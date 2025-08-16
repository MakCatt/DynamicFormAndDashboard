import React, { useMemo, useState, useEffect } from "react"
import {
  Button,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Switch,
  Typography,
  message,
} from "antd"
import dayjs from "dayjs"

const TYPE_OPTIONS = [
  { label: "Строка", value: "string" },
  { label: "Число", value: "number" },
  { label: "Список (multi)", value: "list" },
  { label: "Дата", value: "date" },
  { label: "Логический (да/нет)", value: "boolean" },
  { label: "Многострочный текст", value: "textarea" },
  { label: "Radio (один вариант)", value: "radio" },
]

const FormPage = () => {
  const [form] = Form.useForm()
  const [fieldsState, setFieldsState] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalForm] = Form.useForm()

  // состояние для режима редактирования
  const [isEdit, setIsEdit] = useState(false)
  const [editingKey, setEditingKey] = useState(null) // ключ редактируемого поля (старый)

  // ——— рендер контролов в описании ———
  const renderControl = (field) => {
    const namePath = ["data", field.key]
    const req = field.required ? [{ required: true, message: "Обязательное поле" }] : []

    switch (field.type) {
      case "string":
        return (
          <Form.Item name={namePath} rules={req} style={{ width: "100%", marginBottom: 0 }}>
            <Input placeholder="Введите текст" />
          </Form.Item>
        )
      case "textarea":
        return (
          <Form.Item name={namePath} rules={req} style={{ width: "100%", marginBottom: 0 }}>
            <Input.TextArea placeholder="Введите текст" autoSize={{ minRows: 3 }} />
          </Form.Item>
        )
      case "number":
        return (
          <Form.Item name={namePath} rules={req} style={{ width: "100%", marginBottom: 0 }}>
            <InputNumber style={{ width: "100%" }} placeholder="Введите число" />
          </Form.Item>
        )
      case "list":
        return (
          <Form.Item name={namePath} rules={req} style={{ width: "100%", marginBottom: 0 }}>
            <Select
              mode="multiple"
              placeholder="Выберите элементы"
              options={(field.options ?? []).map((o) => ({ label: o, value: o }))}
            />
          </Form.Item>
        )
      case "radio":
        return (
          <Form.Item name={namePath} rules={req} style={{ width: "100%", marginBottom: 0 }}>
            <Radio.Group options={(field.options ?? []).map((o) => ({ label: o, value: o }))} />
          </Form.Item>
        )
      case "date":
        return (
          <Form.Item name={namePath} rules={req} style={{ width: "100%", marginBottom: 0 }}>
            <DatePicker style={{ width: "100%" }} placeholder="Выберите дату" />
          </Form.Item>
        )
      case "boolean":
        return (
          <Form.Item name={namePath} valuePropName="checked" style={{ width: "100%", marginBottom: 0 }}>
            <Switch />
          </Form.Item>
        )
      default:
        return null
    }
  }

  // ——— открыть модалку "добавить" ———
  const openCreate = () => {
    setIsEdit(false)
    setEditingKey(null)
    modalForm.resetFields()
    setModalOpen(true)
  }

  // ——— открыть модалку "редактировать" ———
  const openEdit = (field) => {
    setIsEdit(true)
    setEditingKey(field.key)
    // Подставляем значения поля в форму модалки
    modalForm.setFieldsValue({
      label: field.label,
      key: field.key,
      type: field.type,
      required: !!field.required,
      options: field.options || [],
    })
    setModalOpen(true)
  }

  // ——— удалить поле ———
  const removeField = (key) => {
    setFieldsState((prev) => prev.filter((f) => f.key !== key))
    const cur = form.getFieldValue("data") || {}
    if (cur[key] !== undefined) {
      const next = { ...cur }
      delete next[key]
      form.setFieldsValue({ data: next })
    }
  }

  // ——— подтвердить модалку (добавить/обновить) ———
  const handleModalOk = async () => {
    try {
      const v = await modalForm.validateFields()
      const normalized = {
        key: v.key.trim(),
        label: v.label.trim(),
        type: v.type,
        required: !!v.required,
        options:
          v.type === "list" || v.type === "radio"
            ? (v.options ?? []).map((s) => String(s).trim()).filter(Boolean)
            : undefined,
      }

      // Проверка уникальности ключа: допускаем текущий редактируемый ключ
      const duplicate = fieldsState.some(
        (f) => f.key === normalized.key && f.key !== editingKey
      )
      if (duplicate) {
        message.error("Ключ уже используется")
        return
      }

      if (isEdit && editingKey) {
        // обновление
        setFieldsState((prev) =>
          prev.map((f) => (f.key === editingKey ? normalized : f))
        )

        // если ключ изменился — перенесём значение из form.data[старыйКлюч] -> form.data[новыйКлюч]
        if (normalized.key !== editingKey) {
          const data = form.getFieldValue("data") || {}
          if (Object.prototype.hasOwnProperty.call(data, editingKey)) {
            const next = { ...data }
            next[normalized.key] = next[editingKey]
            delete next[editingKey]
            form.setFieldsValue({ data: next })
          }
        }

        message.success("Поле обновлено")
      } else {
        // добавление
        setFieldsState((prev) => [...prev, normalized])
        message.success("Поле добавлено")
      }

      setModalOpen(false)
      if (!isEdit) modalForm.resetFields()
      setIsEdit(false)
      setEditingKey(null)
    } catch {
      message.error("Ошибка валидации")
    }
  }

  // ——— отправка всей формы ———
  const handleSubmit = (allValues) => {
    const raw = allValues?.data ?? {}
    const data = {}

    fieldsState.forEach((f) => {
      const v = raw[f.key]
      switch (f.type) {
        case "number":
          data[f.key] = v === "" || v === undefined ? undefined : Number(v)
          break
        case "date":
          data[f.key] = v ? dayjs(v).toISOString() : undefined
          break
        case "boolean":
          data[f.key] = !!v
          break
        default:
          data[f.key] = v
      }
    })

    console.log("schema:", fieldsState)
    console.log("data:", data)
    message.success("Отправлено! Смотри консоль.")
  }

  // ——— элементы Descriptions (1 колонка), с кнопками редактирования/удаления ———
  const descriptionItems = useMemo(
    () =>
      fieldsState.map((field) => ({
        key: field.key,
        label: (
          <Space size={8}>
            <span>
              {field.label}{" "}
              <Typography.Text type="secondary" style={{ fontWeight: 400 }}>
                ({field.type})
              </Typography.Text>
              {field.required && (
                <Typography.Text type="danger" style={{ marginLeft: 6 }}>
                  *
                </Typography.Text>
              )}
            </span>
            <Button
              type="link"
              size="small"
              style={{ paddingInline: 0 }}
              onClick={() => openEdit(field)}
            >
              редактировать
            </Button>
            <Button
              type="link"
              danger
              size="small"
              style={{ paddingInline: 0 }}
              onClick={() => removeField(field.key)}
            >
              удалить
            </Button>
          </Space>
        ),
        children: renderControl(field),
      })),
    [fieldsState]
  )

  return (
    <div style={{ maxWidth: 820, margin: "40px auto", padding: 24 }}>
      <Typography.Title level={3} style={{ marginBottom: 12 }}>
        Динамическая форма
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Поля добавляются и редактируются через модалку. Отображаются одной колонкой.
      </Typography.Paragraph>

      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ data: {} }}>
        <Descriptions
          column={1}
          size="middle"
          items={descriptionItems}
          labelStyle={{ width: 250, justifyContent: "flex-end" }}
        />

        <Space style={{ marginTop: 16 }}>
          <Button type="dashed" onClick={openCreate}>
            Добавить поле
          </Button>
          <Button type="primary" htmlType="submit">
            Отправить форму
          </Button>
        </Space>
      </Form>

      {/* Модалка добавления/редактирования поля */}
      <Modal
        title={isEdit ? "Редактировать поле" : "Добавить поле"}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => {
          setModalOpen(false)
          setIsEdit(false)
          setEditingKey(null)
        }}
        okText={isEdit ? "Сохранить" : "Добавить"}
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={modalForm} layout="vertical" preserve={false}>
          <Form.Item name="label" label="Метка" rules={[{ required: true, message: "Введите метку" }]}>
            <Input placeholder="Например: Имя" />
          </Form.Item>

          <Form.Item
            name="key"
            label="Ключ"
            rules={[
              { required: true, message: "Введите ключ" },
              { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: "Только латиница, цифры, _; не начинать с цифры" },
            ]}
          >
            <Input placeholder="Например: name" />
          </Form.Item>

          <Form.Item name="type" label="Тип" rules={[{ required: true, message: "Выберите тип" }]}>
            <Select options={TYPE_OPTIONS} placeholder="Выберите тип поля" />
          </Form.Item>

          <Form.Item name="required" label="Обязательное?" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>

          {/* Опции только для list/radio */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.type !== cur.type}>
            {({ getFieldValue }) =>
              (getFieldValue("type") === "list" || getFieldValue("type") === "radio") && (
                <Form.List name="options">
                  {(opts, { add, remove }) => (
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Typography.Text>Опции:</Typography.Text>
                      {opts.map((opt) => (
                        <Space key={opt.key} align="baseline" style={{ width: "100%" }}>
                          <Form.Item
                            name={opt.name}
                            rules={[{ required: true, message: "Введите значение опции" }]}
                            style={{ flex: 1 }}
                          >
                            <Input placeholder="Например: Мужской" />
                          </Form.Item>
                          <Button type="text" danger onClick={() => remove(opt.name)}>
                            Удалить
                          </Button>
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add()}>
                        Добавить опцию
                      </Button>
                    </Space>
                  )}
                </Form.List>
              )
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FormPage

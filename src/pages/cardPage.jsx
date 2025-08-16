import React, { useMemo, useRef, useState } from "react"
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Space,
  Typography,
  message,
} from "antd"
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd"

const CardPage = () => {
  const [cards, setCards] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const editingId = useRef(null)

  const [modalForm] = Form.useForm()

  const openCreate = () => {
    setIsEdit(false)
    editingId.current = null
    modalForm.resetFields()
    setModalOpen(true)
  }

  const openEdit = (card) => {
    setIsEdit(true)
    editingId.current = card.id
    modalForm.setFieldsValue({
      title: card.title,
      description: card.description,
      iconUrl: card.iconUrl,
    })
    setModalOpen(true)
  }

  const removeCard = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id))
  }

  const handleModalOk = async () => {
    try {
      const v = await modalForm.validateFields()
      const payload = {
        title: v.title.trim(),
        description: v.description?.trim(),
        iconUrl: v.iconUrl?.trim(),
      }

      if (isEdit && editingId.current) {
        setCards((prev) =>
          prev.map((c) => (c.id === editingId.current ? { ...c, ...payload } : c))
        )
        message.success("Карточка обновлена")
      } else {
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        setCards((prev) => [...prev, { id, ...payload }])
        message.success("Карточка добавлена")
      }

      setModalOpen(false)
      modalForm.resetFields()
    } catch {
      /* ошибки валидации формы модалки */
    }
  }

  // Drag & Drop
  const onDragEnd = (result) => {
    if (!result.destination) return
    const items = Array.from(cards)
    const [moved] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, moved)
    setCards(items)
  }

  // Export / Import
  const exportCards = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      cards: cards.map(({ id, title, description, iconUrl }) => ({
        id,
        title,
        description,
        iconUrl,
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cards.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const fileInputRef = useRef(null)
  const importCardsClick = () => fileInputRef.current?.click()

  const importCardsChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      if (!parsed || !Array.isArray(parsed.cards)) {
        message.error("Неверный формат файла")
        e.currentTarget.value = ""
        return
      }

      const next = parsed.cards
        .filter((c) => c && typeof c.title === "string")
        .map((c) => ({
          id:
            typeof c.id === "string" && c.id
              ? c.id
              : (typeof crypto !== "undefined" && "randomUUID" in crypto
                  ? crypto.randomUUID()
                  : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
          title: String(c.title),
          description: c.description ? String(c.description) : undefined,
          iconUrl: c.iconUrl ? String(c.iconUrl) : undefined,
        }))

      setCards(next)
      message.success(`Импортировано карточек: ${next.length}`)
    } catch (err) {
      console.error(err)
      message.error("Не удалось импортировать файл")
    } finally {
      e.currentTarget.value = ""
    }
  }

  const cardView = (card, index) => (
    <Draggable draggableId={card.id} index={index} key={card.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            userSelect: "none",
            marginBottom: 12,
            opacity: snapshot.isDragging ? 0.9 : 1,
          }}
        >
          <Card
            size="small"
            title={
              <Space>
                {card.iconUrl ? (
                  <img
                    src={card.iconUrl}
                    alt="icon"
                    style={{ width: 20, height: 20, objectFit: "cover", borderRadius: 4 }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ) : null}
                <span>{card.title || "Без заголовка"}</span>
              </Space>
            }
            extra={
              <Space size={8}>
                <Button type="link" onClick={() => openEdit(card)}>
                  Редактировать
                </Button>
                <Button type="link" danger onClick={() => removeCard(card.id)}>
                  Удалить
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Typography.Text type="secondary">Заголовок:</Typography.Text>
              <Typography.Text>{card.title || "—"}</Typography.Text>

              <Typography.Text type="secondary">Описание:</Typography.Text>
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {card.description || "—"}
              </Typography.Paragraph>

              <Typography.Text type="secondary">Иконка (URL):</Typography.Text>
              <Typography.Text type="secondary">
                {card.iconUrl ? card.iconUrl : "—"}
              </Typography.Text>
            </Space>
          </Card>
        </div>
      )}
    </Draggable>
  )

  const list = useMemo(
    () =>
      cards.length === 0 ? (
        <Empty description="Пока нет карточек. Добавьте первую." />
      ) : (
        cards.map((c, i) => cardView(c, i))
      ),
    [cards]
  )

  return (
    <div style={{ maxWidth: 960, margin: "40px auto", padding: 24 }}>
      <Typography.Title level={3} style={{ marginBottom: 8 }}>
        Доска с карточками
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Добавляйте/редактируйте/удаляйте карточки. Перетаскивайте их мышью. Экспорт/импорт — JSON.
      </Typography.Paragraph>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={openCreate}>
          Добавить карточку
        </Button>
        <Button onClick={exportCards}>Экспорт JSON</Button>
        <Button onClick={importCardsClick}>Импорт JSON</Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={importCardsChange}
          style={{ display: "none" }}
        />
      </Space>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                minHeight: 200,
                border: "1px dashed #d9d9d9",
                borderRadius: 8,
                padding: 12,
                background: snapshot.isDraggingOver ? "#f0f9ff" : "#fafafa",
              }}
            >
              {list}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Modal
        title={isEdit ? "Редактировать карточку" : "Добавить карточку"}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        okText={isEdit ? "Сохранить" : "Добавить"}
        cancelText="Отмена"
        destroyOnClose
      >
        <Form form={modalForm} layout="vertical" preserve={false}>
          <Form.Item
            name="title"
            label="Заголовок"
            rules={[{ required: true, message: "Введите заголовок" }]}
          >
            <Input placeholder="Например: Задача 1" />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <Input.TextArea placeholder="Краткое описание" autoSize={{ minRows: 3 }} />
          </Form.Item>

          <Form.Item
            name="iconUrl"
            label="Иконка (URL)"
            tooltip="Ссылка на изображение (PNG/JPG/SVG и т. п.)"
            rules={[
              {
                type: "url",
                warningOnly: true,
                message: "Введите корректный URL (или оставьте пустым)",
              },
            ]}
          >
            <Input placeholder="https://example.com/icon.png" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CardPage

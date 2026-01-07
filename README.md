# Integration API - MySQL + RabbitMQ

Sistema pra receber pedidos via API e processar de forma assíncrona usando RabbitMQ e MySQL.

## Como funciona

Cliente manda pedido pra API → API publica na fila → Worker consome e salva no BD.

```
Cliente → API (3001) → RabbitMQ → Worker → MySQL
```

## Setup

Precisa de Docker e Docker Compose instalado.

```bash
docker-compose up -d
```

Pronto! Os serviços vão estar rodando em:
- API: http://localhost:3001
- RabbitMQ: http://localhost:15672
- MySQL: localhost:3306

## Usar

Enviar um pedido:

```bash
curl -X POST http://localhost:3001/orders \
  -H "Content-Type: application/json" \
  -d '{"orderId": 101, "value": 150.00, "customer": "João"}'
```

A API vai retornar:
```json
{"message":"Order received"}
```

E o worker processa e salva no banco automaticamente.

## Verificar dados

```bash
docker exec -i integration-api-mysql-rabbitmq_mysql_1 mysql \
  -uroot -proot integration \
  -e "SELECT id, external_id, JSON_EXTRACT(payload, '$.customer') as customer, 
      JSON_EXTRACT(payload, '$.value') as value, status FROM orders;"
```

## Estrutura

```
src/
├── app.js              # Express config
├── server.js           # Start server
├── config/
│   └── rabbitmq.js     # Pub/sub RabbitMQ
├── database/
│   └── index.js        # MySQL pool + retries
├── modules/orders/
│   ├── controller.js    # Publica no RabbitMQ
│   └── routes.js        # Rotas
└── workers/
    └── orderConsumer.js # Consome fila
```

## BD

Tabela `orders`:
- `id`: PK
- `external_id`: orderId do pedido
- `payload`: JSON com todos os dados
- `status`: PENDING por padrão
- `created_at`: timestamp

## Logs

Ver logs do worker:
```bash
docker-compose logs worker
```

Ou da API:
```bash
docker-compose logs api
```

Seguir em tempo real:
```bash
docker-compose logs -f worker
```

## Parar

```bash
docker-compose down
```

Se quiser limpar dados:
```bash
docker-compose down -v
```

## Env vars

Tudo tem default, mas pode customizar em `docker-compose.yml`:
- DB_HOST (default: mysql)
- DB_USER (default: root)
- DB_PASSWORD (default: root)
- DB_NAME (default: integration)
- RABBITMQ_URL (default: amqp://rabbitmq)

## Dependências

- Express
- mysql2
- amqplib
- nodemon (dev)

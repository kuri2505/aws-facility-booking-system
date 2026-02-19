# 🏢 AWS Facility Booking System

Serverless facility & meeting room booking system built with AWS CDK (TypeScript).

![Architecture](docs/architecture.png)

## 📋 Overview

企業内の施設・会議室をオンラインで予約・管理できるサーバーレスWebアプリケーションです。
AWS CDK (TypeScript) を使ったInfrastructure as Code (IaC) で構築しており、完全サーバーレスアーキテクチャを採用しています。

## 🚀 Features

| 機能 | 一般ユーザー | 管理者 |
|------|------------|--------|
| 会議室一覧・空き状況確認 | ✅ | ✅ |
| 予約作成（即時確定） | ✅ | ✅ |
| 予約変更・キャンセル | ✅（自分の予約のみ） | ✅ |
| 予約履歴閲覧 | ✅（自分のみ） | ✅（全ユーザー） |
| 会議室の登録・編集・削除 | ❌ | ✅ |
| 全予約の管理 | ❌ | ✅ |

## 🏗️ Architecture

### 使用AWSサービスと選定理由

| サービス | 役割 | 選定理由 |
|---------|------|---------|
| **Amazon Cognito** | ユーザー認証・権限管理 | マネージドな認証基盤。一般ユーザーと管理者のロール管理が容易 |
| **Amazon API Gateway** | REST APIエンドポイント | サーバーレスなAPIの入口。CognitoのオーソライザーによるAPI認証も簡潔に実装可能 |
| **AWS Lambda** | ビジネスロジック実行 | イベント駆動でスケーラブル。使った分だけ課金でコスト効率が高い |
| **AWS Step Functions** | 予約フロー制御 | 複雑な状態管理をビジュアルで把握・管理できる。将来の承認フロー追加も容易 |
| **Amazon DynamoDB** | データ永続化 | サーバーレスと相性が良いNoSQL。オートスケーリングで高可用性を実現 |
| **Amazon SES** | メール通知 | 予約確定・リマインダーメールの送信 |
| **Amazon EventBridge** | スケジューリング | リマインダーの定期実行トリガー |
| **AWS CDK (TypeScript)** | Infrastructure as Code | インフラをコードで管理。再現性・保守性が高い |

### リクエストの流れ

```
ユーザー
  ↓
Amazon Cognito（認証・認可）
  ↓
Amazon API Gateway（エンドポイント）
  ↓
AWS Lambda（ビジネスロジック）
  ↓
AWS Step Functions（予約フロー制御）
  ↓
Amazon DynamoDB（データ保存）
  ↓
Amazon SES（予約確定メール送信）

EventBridge（定期実行）→ Lambda → SES（リマインダー送信）
```

## 🗄️ Data Model（DynamoDB）

### Rooms テーブル（会議室情報）

| 属性 | 種別 | 例 |
|-----|------|-----|
| `roomId` | PK | `room-001` |
| `name` | 属性 | `第1会議室` |
| `capacity` | 属性 | `10` |
| `location` | 属性 | `3F` |
| `facilities` | 属性 | `["プロジェクター", "ホワイトボード"]` |

### Reservations テーブル（予約情報）

| 属性 | 種別 | 例 |
|-----|------|-----|
| `reservationId` | PK | `rsv-20250219-001` |
| `roomId#date` | SK | `room-001#2025-02-19` |
| `userId` | 属性 | `user-abc123` |
| `startTime` | 属性 | `10:00` |
| `endTime` | 属性 | `11:00` |
| `status` | 属性 | `CONFIRMED` |
| `createdAt` | 属性 | `2025-02-19T09:00:00Z` |

#### GSI（グローバルセカンダリインデックス）

| GSI名 | PK | SK | 用途 |
|-------|----|----|------|
| `userIndex` | `userId` | `createdAt` | ユーザーの予約履歴取得 |
| `roomDateIndex` | `roomId#date` | `startTime` | 特定会議室・特定日の予約一覧取得 |

## 🛠️ Tech Stack

- **IaC:** AWS CDK (TypeScript)
- **Runtime:** Node.js 20.x
- **言語:** TypeScript
- **テスト:** Jest

## 📁 Project Structure

```
aws-facility-booking-system/
├── cdk/                    # CDKインフラコード
│   ├── bin/
│   │   └── app.ts
│   ├── lib/
│   │   ├── cognito-stack.ts
│   │   ├── api-stack.ts
│   │   ├── lambda-stack.ts
│   │   ├── dynamodb-stack.ts
│   │   └── stepfunctions-stack.ts
│   └── test/
├── lambda/                 # Lambda関数コード
│   ├── reservations/
│   │   ├── create.ts
│   │   ├── update.ts
│   │   ├── cancel.ts
│   │   └── list.ts
│   └── rooms/
│       ├── create.ts
│       ├── update.ts
│       ├── delete.ts
│       └── list.ts
├── docs/                   # ドキュメント・図
│   └── architecture.png
└── README.md
```

## 🚀 Getting Started

### 前提条件

- Node.js 20.x 以上
- AWS CLI（設定済み）
- AWS CDK 2.x

### セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/your-username/aws-facility-booking-system.git
cd aws-facility-booking-system

# 依存関係のインストール
cd cdk
npm install

# CDKブートストラップ（初回のみ）
cdk bootstrap

# デプロイ
cdk deploy --all
```

## 📝 API Endpoints

### 会議室

| メソッド | エンドポイント | 説明 | 権限 |
|---------|--------------|------|------|
| GET | `/rooms` | 会議室一覧取得 | 全ユーザー |
| GET | `/rooms/{roomId}/availability` | 空き状況確認 | 全ユーザー |
| POST | `/rooms` | 会議室作成 | 管理者のみ |
| PUT | `/rooms/{roomId}` | 会議室更新 | 管理者のみ |
| DELETE | `/rooms/{roomId}` | 会議室削除 | 管理者のみ |

### 予約

| メソッド | エンドポイント | 説明 | 権限 |
|---------|--------------|------|------|
| GET | `/reservations` | 予約一覧取得 | 全ユーザー |
| POST | `/reservations` | 予約作成 | 全ユーザー |
| PUT | `/reservations/{reservationId}` | 予約変更 | 全ユーザー |
| DELETE | `/reservations/{reservationId}` | 予約キャンセル | 全ユーザー |

## 🌟 Learning Points

このプロジェクトで習得したスキル・知識

- AWS CDK (TypeScript) によるInfrastructure as Code
- DynamoDBのデータモデリング（アクセスパターンに基づいた設計・GSI活用）
- サーバーレスアーキテクチャの設計原則
- Step Functionsによるワークフロー制御
- Cognitoを使った認証・認可の実装
- イベント駆動アーキテクチャ（EventBridge + Lambda）

## 📄 License

MIT

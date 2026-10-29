use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::error::ApiError;

// Prisma's default `@id @default(uuid())` maps to plain Postgres `text`, not
// the native `uuid` type — every id/FK column in this schema is `text`.
// Bind them as String, not uuid::Uuid, or sqlx's compile-time query checking
// will reject the mismatch against the real column type.
#[derive(Serialize, sqlx::FromRow)]
pub struct Vendor {
    pub id: String,
    pub name: String,
    #[sqlx(rename = "companyId")]
    #[serde(rename = "companyId")]
    pub company_id: Option<String>,
    #[sqlx(rename = "categoryId")]
    #[serde(rename = "categoryId")]
    pub category_id: Option<String>,
    #[sqlx(rename = "industryId")]
    #[serde(rename = "industryId")]
    pub industry_id: Option<String>,
}

#[derive(Deserialize)]
pub struct ListVendorsQuery {
    pub search: Option<String>,
    #[serde(rename = "companyId")]
    pub company_id: Option<String>,
    #[serde(rename = "categoryId")]
    pub category_id: Option<String>,
    #[serde(rename = "industryId")]
    pub industry_id: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: i64,
    #[serde(default)]
    pub offset: i64,
}

fn default_limit() -> i64 {
    50
}

#[derive(Serialize)]
pub struct ListVendorsResponse {
    pub items: Vec<Vendor>,
    pub limit: i64,
    pub offset: i64,
}

pub async fn list_vendors(
    State(pool): State<PgPool>,
    Query(params): Query<ListVendorsQuery>,
) -> Result<Json<ListVendorsResponse>, ApiError> {
    let limit = params.limit.clamp(1, 200);
    let offset = params.offset.max(0);
    let search_pattern = params.search.as_ref().map(|s| format!("%{s}%"));

    let items = sqlx::query_as::<_, Vendor>(
        r#"
        SELECT id, name, "companyId", "categoryId", "industryId"
        FROM vendors
        WHERE ($1::text IS NULL OR name ILIKE $1)
          AND ($2::text IS NULL OR "companyId" = $2)
          AND ($3::text IS NULL OR "categoryId" = $3)
          AND ($4::text IS NULL OR "industryId" = $4)
        ORDER BY name
        LIMIT $5 OFFSET $6
        "#,
    )
    .bind(&search_pattern)
    .bind(&params.company_id)
    .bind(&params.category_id)
    .bind(&params.industry_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(&pool)
    .await?;

    Ok(Json(ListVendorsResponse { items, limit, offset }))
}

pub async fn get_vendor(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> Result<Json<Vendor>, ApiError> {
    let vendor = sqlx::query_as::<_, Vendor>(
        r#"
        SELECT id, name, "companyId", "categoryId", "industryId"
        FROM vendors
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    Ok(Json(vendor))
}

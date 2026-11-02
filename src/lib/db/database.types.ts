
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "addresses": {
                  Row: {
                    "city": string,"country": string,"created_at": string,"customer_id": string,"full_name": string,"id": string,"is_default_billing": boolean,"is_default_shipping": boolean,"label": string | null,"landmark": string | null,"line1": string,"line2": string | null,"phone": string,"pincode": string,"state": string,"state_code": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "city": string,"country"?: string,"created_at"?: string,"customer_id": string,"full_name": string,"id"?: string,"is_default_billing"?: boolean,"is_default_shipping"?: boolean,"label"?: string | null,"landmark"?: string | null,"line1": string,"line2"?: string | null,"phone": string,"pincode": string,"state": string,"state_code"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "city"?: string,"country"?: string,"created_at"?: string,"customer_id"?: string,"full_name"?: string,"id"?: string,"is_default_billing"?: boolean,"is_default_shipping"?: boolean,"label"?: string | null,"landmark"?: string | null,"line1"?: string,"line2"?: string | null,"phone"?: string,"pincode"?: string,"state"?: string,"state_code"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "addresses_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"admin_tasks": {
                  Row: {
                    "assigned_role": Database["public"]['Enums']["staff_role"] | null,"assigned_to": string | null,"completed_at": string | null,"completed_by": string | null,"created_at": string,"dedupe_key": string | null,"due_at": string | null,"grievance_id": string | null,"id": string,"order_id": string | null,"order_status": Database["public"]['Enums']["order_status"] | null,"priority": number,"return_id": string | null,"status": string,"title": string,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_role"?: Database["public"]['Enums']["staff_role"] | null,"assigned_to"?: string | null,"completed_at"?: string | null,"completed_by"?: string | null,"created_at"?: string,"dedupe_key"?: string | null,"due_at"?: string | null,"grievance_id"?: string | null,"id"?: string,"order_id"?: string | null,"order_status"?: Database["public"]['Enums']["order_status"] | null,"priority"?: number,"return_id"?: string | null,"status"?: string,"title": string,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "assigned_role"?: Database["public"]['Enums']["staff_role"] | null,"assigned_to"?: string | null,"completed_at"?: string | null,"completed_by"?: string | null,"created_at"?: string,"dedupe_key"?: string | null,"due_at"?: string | null,"grievance_id"?: string | null,"id"?: string,"order_id"?: string | null,"order_status"?: Database["public"]['Enums']["order_status"] | null,"priority"?: number,"return_id"?: string | null,"status"?: string,"title"?: string,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "admin_tasks_grievance_id_fkey"
      columns: ["grievance_id"]
isOneToOne: false
      referencedRelation: "grievances"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "admin_tasks_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "admin_tasks_return_id_fkey"
      columns: ["return_id"]
isOneToOne: false
      referencedRelation: "returns"
      referencedColumns: ["id"]
    }
                  ]
                },"announcements": {
                  Row: {
                    "active": boolean,"created_at": string,"ends_at": string | null,"href": string | null,"id": string,"message": string,"position": number,"starts_at": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"ends_at"?: string | null,"href"?: string | null,"id"?: string,"message": string,"position"?: number,"starts_at"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"ends_at"?: string | null,"href"?: string | null,"id"?: string,"message"?: string,"position"?: number,"starts_at"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_role": Database["public"]['Enums']["staff_role"] | null,"after": Json | null,"before": Json | null,"context": Json | null,"created_at": string,"entity_id": string | null,"entity_type": string,"id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_role"?: Database["public"]['Enums']["staff_role"] | null,"after"?: Json | null,"before"?: Json | null,"context"?: Json | null,"created_at"?: string,"entity_id"?: string | null,"entity_type": string,"id"?: never
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_role"?: Database["public"]['Enums']["staff_role"] | null,"after"?: Json | null,"before"?: Json | null,"context"?: Json | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string,"id"?: never
                  }
                  Relationships: [
                    
                  ]
                },"authenticity_labels": {
                  Row: {
                    "created_at": string,"id": string,"issued_on": string | null,"label_number": string,"label_type": string,"notes": string | null,"product_id": string | null,"status": string,"updated_at": string,"variant_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"issued_on"?: string | null,"label_number": string,"label_type": string,"notes"?: string | null,"product_id"?: string | null,"status"?: string,"updated_at"?: string,"variant_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"issued_on"?: string | null,"label_number"?: string,"label_type"?: string,"notes"?: string | null,"product_id"?: string | null,"status"?: string,"updated_at"?: string,"variant_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "authenticity_labels_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "authenticity_labels_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"automatic_offers": {
                  Row: {
                    "active": boolean,"amount_paise": number | null,"applies_to": NonNullable<Json>,"created_at": string,"customer_message": string,"ends_at": string | null,"id": string,"max_discount_paise": number | null,"min_order_paise": number,"name": string,"percent_bps": number | null,"prepaid_only": boolean,"priority": number,"starts_at": string | null,"type": Database["public"]['Enums']["coupon_type"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"amount_paise"?: number | null,"applies_to"?: NonNullable<Json>,"created_at"?: string,"customer_message": string,"ends_at"?: string | null,"id"?: string,"max_discount_paise"?: number | null,"min_order_paise"?: number,"name": string,"percent_bps"?: number | null,"prepaid_only"?: boolean,"priority"?: number,"starts_at"?: string | null,"type": Database["public"]['Enums']["coupon_type"],"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"amount_paise"?: number | null,"applies_to"?: NonNullable<Json>,"created_at"?: string,"customer_message"?: string,"ends_at"?: string | null,"id"?: string,"max_discount_paise"?: number | null,"min_order_paise"?: number,"name"?: string,"percent_bps"?: number | null,"prepaid_only"?: boolean,"priority"?: number,"starts_at"?: string | null,"type"?: Database["public"]['Enums']["coupon_type"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"banners": {
                  Row: {
                    "active": boolean,"alt": string,"created_at": string,"cta_href": string | null,"cta_label": string | null,"ends_at": string | null,"id": string,"image_path": string | null,"mobile_image_path": string | null,"placement": string,"position": number,"starts_at": string | null,"subtitle": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"alt"?: string,"created_at"?: string,"cta_href"?: string | null,"cta_label"?: string | null,"ends_at"?: string | null,"id"?: string,"image_path"?: string | null,"mobile_image_path"?: string | null,"placement": string,"position"?: number,"starts_at"?: string | null,"subtitle"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"alt"?: string,"created_at"?: string,"cta_href"?: string | null,"cta_label"?: string | null,"ends_at"?: string | null,"id"?: string,"image_path"?: string | null,"mobile_image_path"?: string | null,"placement"?: string,"position"?: number,"starts_at"?: string | null,"subtitle"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"cart_items": {
                  Row: {
                    "cart_id": string,"created_at": string,"id": string,"is_swatch": boolean,"quantity": number,"updated_at": string,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cart_id": string,"created_at"?: string,"id"?: string,"is_swatch"?: boolean,"quantity": number,"updated_at"?: string,"variant_id": string
                  }
                  Update: {
                    "cart_id"?: string,"created_at"?: string,"id"?: string,"is_swatch"?: boolean,"quantity"?: number,"updated_at"?: string,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "cart_items_cart_id_fkey"
      columns: ["cart_id"]
isOneToOne: false
      referencedRelation: "carts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "cart_items_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"carts": {
                  Row: {
                    "converted_order_id": string | null,"coupon_code": string | null,"created_at": string,"customer_id": string | null,"email": string | null,"gift_message": string | null,"gift_wrap": boolean,"id": string,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "converted_order_id"?: string | null,"coupon_code"?: string | null,"created_at"?: string,"customer_id"?: string | null,"email"?: string | null,"gift_message"?: string | null,"gift_wrap"?: boolean,"id"?: string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "converted_order_id"?: string | null,"coupon_code"?: string | null,"created_at"?: string,"customer_id"?: string | null,"email"?: string | null,"gift_message"?: string | null,"gift_wrap"?: boolean,"id"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "carts_converted_order_fk"
      columns: ["converted_order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "carts_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"collection_products": {
                  Row: {
                    "collection_id": string,"position": number,"product_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "collection_id": string,"position"?: number,"product_id": string
                  }
                  Update: {
                    "collection_id"?: string,"position"?: number,"product_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "collection_products_collection_id_fkey"
      columns: ["collection_id"]
isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "collection_products_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"collections": {
                  Row: {
                    "body": string | null,"created_at": string,"default_sort": string,"faqs": NonNullable<Json>,"h1": string | null,"hero_image_path": string | null,"id": string,"intro": string | null,"membership": string,"noindex": boolean,"og_image_path": string | null,"parent_id": string | null,"path": string | null,"position": number,"rules": NonNullable<Json>,"scheduled_at": string | null,"section": string,"seo_description": string | null,"seo_title": string | null,"slug": string,"status": Database["public"]['Enums']["publish_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string | null,"created_at"?: string,"default_sort"?: string,"faqs"?: NonNullable<Json>,"h1"?: string | null,"hero_image_path"?: string | null,"id"?: string,"intro"?: string | null,"membership"?: string,"noindex"?: boolean,"og_image_path"?: string | null,"parent_id"?: string | null,"path"?: never,"position"?: number,"rules"?: NonNullable<Json>,"scheduled_at"?: string | null,"section": string,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["publish_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string | null,"created_at"?: string,"default_sort"?: string,"faqs"?: NonNullable<Json>,"h1"?: string | null,"hero_image_path"?: string | null,"id"?: string,"intro"?: string | null,"membership"?: string,"noindex"?: boolean,"og_image_path"?: string | null,"parent_id"?: string | null,"path"?: never,"position"?: number,"rules"?: NonNullable<Json>,"scheduled_at"?: string | null,"section"?: string,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["publish_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "collections_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    }
                  ]
                },"consent_events": {
                  Row: {
                    "anonymous_id": string | null,"created_at": string,"customer_id": string | null,"email": string | null,"granted": boolean,"id": number,"notice_version": string,"phone": string | null,"purpose": Database["public"]['Enums']["consent_purpose"],"source": string,"user_agent": string | null,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "anonymous_id"?: string | null,"created_at"?: string,"customer_id"?: string | null,"email"?: string | null,"granted": boolean,"id"?: never,"notice_version": string,"phone"?: string | null,"purpose": Database["public"]['Enums']["consent_purpose"],"source": string,"user_agent"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "anonymous_id"?: string | null,"created_at"?: string,"customer_id"?: string | null,"email"?: string | null,"granted"?: boolean,"id"?: never,"notice_version"?: string,"phone"?: string | null,"purpose"?: Database["public"]['Enums']["consent_purpose"],"source"?: string,"user_agent"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "consent_events_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"coupon_redemptions": {
                  Row: {
                    "coupon_id": string,"created_at": string,"customer_id": string | null,"discount_paise": number,"id": string,"order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "coupon_id": string,"created_at"?: string,"customer_id"?: string | null,"discount_paise": number,"id"?: string,"order_id": string
                  }
                  Update: {
                    "coupon_id"?: string,"created_at"?: string,"customer_id"?: string | null,"discount_paise"?: number,"id"?: string,"order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "coupon_redemptions_coupon_id_fkey"
      columns: ["coupon_id"]
isOneToOne: false
      referencedRelation: "coupons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coupon_redemptions_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "coupon_redemptions_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"coupons": {
                  Row: {
                    "active": boolean,"amount_paise": number | null,"applies_to": NonNullable<Json>,"code": string,"created_at": string,"created_by": string | null,"description": string | null,"ends_at": string | null,"first_order_only": boolean,"id": string,"max_discount_paise": number | null,"min_order_paise": number,"percent_bps": number | null,"starts_at": string | null,"times_used": number,"type": Database["public"]['Enums']["coupon_type"],"updated_at": string,"usage_limit": number | null,"usage_limit_per_customer": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"amount_paise"?: number | null,"applies_to"?: NonNullable<Json>,"code": string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"ends_at"?: string | null,"first_order_only"?: boolean,"id"?: string,"max_discount_paise"?: number | null,"min_order_paise"?: number,"percent_bps"?: number | null,"starts_at"?: string | null,"times_used"?: number,"type": Database["public"]['Enums']["coupon_type"],"updated_at"?: string,"usage_limit"?: number | null,"usage_limit_per_customer"?: number | null
                  }
                  Update: {
                    "active"?: boolean,"amount_paise"?: number | null,"applies_to"?: NonNullable<Json>,"code"?: string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"ends_at"?: string | null,"first_order_only"?: boolean,"id"?: string,"max_discount_paise"?: number | null,"min_order_paise"?: number,"percent_bps"?: number | null,"starts_at"?: string | null,"times_used"?: number,"type"?: Database["public"]['Enums']["coupon_type"],"updated_at"?: string,"usage_limit"?: number | null,"usage_limit_per_customer"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"credit_notes": {
                  Row: {
                    "cgst_paise": number,"created_at": string,"created_by": string | null,"credit_note_number": string,"financial_year": string,"id": string,"igst_paise": number,"invoice_id": string,"issued_at": string,"lines": NonNullable<Json>,"order_id": string,"pdf_path": string | null,"reason": string,"sgst_paise": number,"taxable_paise": number,"total_paise": number
                  }
                  ComputedFields: never
                  Insert: {
                    "cgst_paise"?: number,"created_at"?: string,"created_by"?: string | null,"credit_note_number": string,"financial_year": string,"id"?: string,"igst_paise"?: number,"invoice_id": string,"issued_at"?: string,"lines"?: NonNullable<Json>,"order_id": string,"pdf_path"?: string | null,"reason": string,"sgst_paise"?: number,"taxable_paise": number,"total_paise": number
                  }
                  Update: {
                    "cgst_paise"?: number,"created_at"?: string,"created_by"?: string | null,"credit_note_number"?: string,"financial_year"?: string,"id"?: string,"igst_paise"?: number,"invoice_id"?: string,"issued_at"?: string,"lines"?: NonNullable<Json>,"order_id"?: string,"pdf_path"?: string | null,"reason"?: string,"sgst_paise"?: number,"taxable_paise"?: number,"total_paise"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "credit_notes_invoice_id_fkey"
      columns: ["invoice_id"]
isOneToOne: false
      referencedRelation: "invoices"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "credit_notes_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"customer_notes": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"customer_id": string,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"customer_id": string,"id"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"customer_id"?: string,"id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "customer_notes_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"customers": {
                  Row: {
                    "accepts_whatsapp_updates": boolean,"business_name": string | null,"created_at": string,"deleted_at": string | null,"email": string | null,"full_name": string | null,"gstin": string | null,"id": string,"phone": string | null,"tags": (string)[],"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accepts_whatsapp_updates"?: boolean,"business_name"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"email"?: string | null,"full_name"?: string | null,"gstin"?: string | null,"id"?: string,"phone"?: string | null,"tags"?: (string)[],"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "accepts_whatsapp_updates"?: boolean,"business_name"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"email"?: string | null,"full_name"?: string | null,"gstin"?: string | null,"id"?: string,"phone"?: string | null,"tags"?: (string)[],"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"data_requests": {
                  Row: {
                    "completed_at": string | null,"created_at": string,"customer_id": string | null,"details": string | null,"due_at": string,"email": string,"handled_by": string | null,"id": string,"response": string | null,"status": string,"type": string,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string | null,"created_at"?: string,"customer_id"?: string | null,"details"?: string | null,"due_at"?: string,"email": string,"handled_by"?: string | null,"id"?: string,"response"?: string | null,"status"?: string,"type": string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "completed_at"?: string | null,"created_at"?: string,"customer_id"?: string | null,"details"?: string | null,"due_at"?: string,"email"?: string,"handled_by"?: string | null,"id"?: string,"response"?: string | null,"status"?: string,"type"?: string,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "data_requests_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"document_sequences": {
                  Row: {
                    "financial_year": string,"last_value": number,"series": string
                  }
                  ComputedFields: never
                  Insert: {
                    "financial_year": string,"last_value"?: number,"series": string
                  }
                  Update: {
                    "financial_year"?: string,"last_value"?: number,"series"?: string
                  }
                  Relationships: [
                    
                  ]
                },"enquiries": {
                  Row: {
                    "assigned_to": string | null,"company": string | null,"created_at": string,"email": string | null,"gstin": string | null,"id": string,"message": string,"name": string,"phone": string | null,"product_id": string | null,"quantity_note": string | null,"status": string,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "assigned_to"?: string | null,"company"?: string | null,"created_at"?: string,"email"?: string | null,"gstin"?: string | null,"id"?: string,"message": string,"name": string,"phone"?: string | null,"product_id"?: string | null,"quantity_note"?: string | null,"status"?: string,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "assigned_to"?: string | null,"company"?: string | null,"created_at"?: string,"email"?: string | null,"gstin"?: string | null,"id"?: string,"message"?: string,"name"?: string,"phone"?: string | null,"product_id"?: string | null,"quantity_note"?: string | null,"status"?: string,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "enquiries_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"gift_card_transactions": {
                  Row: {
                    "created_at": string,"delta_paise": number,"gift_card_id": string,"id": number,"note": string | null,"order_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"delta_paise": number,"gift_card_id": string,"id"?: never,"note"?: string | null,"order_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"delta_paise"?: number,"gift_card_id"?: string,"id"?: never,"note"?: string | null,"order_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "gift_card_transactions_gift_card_id_fkey"
      columns: ["gift_card_id"]
isOneToOne: false
      referencedRelation: "gift_cards"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gift_card_transactions_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"gift_cards": {
                  Row: {
                    "active": boolean,"balance_paise": number,"code": string,"created_at": string,"created_by": string | null,"customer_id": string | null,"expires_at": string | null,"id": string,"initial_paise": number,"issued_reason": string,"return_id": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"balance_paise": number,"code": string,"created_at"?: string,"created_by"?: string | null,"customer_id"?: string | null,"expires_at"?: string | null,"id"?: string,"initial_paise": number,"issued_reason"?: string,"return_id"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"balance_paise"?: number,"code"?: string,"created_at"?: string,"created_by"?: string | null,"customer_id"?: string | null,"expires_at"?: string | null,"id"?: string,"initial_paise"?: number,"issued_reason"?: string,"return_id"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gift_cards_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gift_cards_return_id_fkey"
      columns: ["return_id"]
isOneToOne: false
      referencedRelation: "returns"
      referencedColumns: ["id"]
    }
                  ]
                },"grievances": {
                  Row: {
                    "ack_due_at": string,"acknowledged_at": string | null,"assigned_to": string | null,"category": string,"created_at": string,"customer_id": string | null,"description": string,"email": string,"id": string,"name": string,"order_id": string | null,"order_number": string | null,"phone": string | null,"reference": string,"resolution": string | null,"resolve_due_at": string,"resolved_at": string | null,"status": Database["public"]['Enums']["grievance_status"],"subject": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ack_due_at"?: string,"acknowledged_at"?: string | null,"assigned_to"?: string | null,"category"?: string,"created_at"?: string,"customer_id"?: string | null,"description": string,"email": string,"id"?: string,"name": string,"order_id"?: string | null,"order_number"?: string | null,"phone"?: string | null,"reference"?: string,"resolution"?: string | null,"resolve_due_at"?: string,"resolved_at"?: string | null,"status"?: Database["public"]['Enums']["grievance_status"],"subject": string,"updated_at"?: string
                  }
                  Update: {
                    "ack_due_at"?: string,"acknowledged_at"?: string | null,"assigned_to"?: string | null,"category"?: string,"created_at"?: string,"customer_id"?: string | null,"description"?: string,"email"?: string,"id"?: string,"name"?: string,"order_id"?: string | null,"order_number"?: string | null,"phone"?: string | null,"reference"?: string,"resolution"?: string | null,"resolve_due_at"?: string,"resolved_at"?: string | null,"status"?: Database["public"]['Enums']["grievance_status"],"subject"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "grievances_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "grievances_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"home_sections": {
                  Row: {
                    "active": boolean,"config": NonNullable<Json>,"created_at": string,"ends_at": string | null,"id": string,"position": number,"starts_at": string | null,"subtitle": string | null,"title": string | null,"type": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"config"?: NonNullable<Json>,"created_at"?: string,"ends_at"?: string | null,"id"?: string,"position"?: number,"starts_at"?: string | null,"subtitle"?: string | null,"title"?: string | null,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"config"?: NonNullable<Json>,"created_at"?: string,"ends_at"?: string | null,"id"?: string,"position"?: number,"starts_at"?: string | null,"subtitle"?: string | null,"title"?: string | null,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"inventory_levels": {
                  Row: {
                    "location_id": string,"low_stock_threshold": number | null,"on_hand": number,"reserved": number,"updated_at": string,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "location_id": string,"low_stock_threshold"?: number | null,"on_hand"?: number,"reserved"?: number,"updated_at"?: string,"variant_id": string
                  }
                  Update: {
                    "location_id"?: string,"low_stock_threshold"?: number | null,"on_hand"?: number,"reserved"?: number,"updated_at"?: string,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventory_levels_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "stock_locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventory_levels_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"invoices": {
                  Row: {
                    "buyer_gstin": string | null,"buyer_name": string | null,"cgst_paise": number,"created_at": string,"created_by": string | null,"financial_year": string,"id": string,"igst_paise": number,"invoice_number": string,"issued_at": string,"lines": NonNullable<Json>,"order_id": string,"pdf_path": string | null,"place_of_supply_state_code": string | null,"seller_gstin": string | null,"sgst_paise": number,"taxable_paise": number,"total_paise": number
                  }
                  ComputedFields: never
                  Insert: {
                    "buyer_gstin"?: string | null,"buyer_name"?: string | null,"cgst_paise"?: number,"created_at"?: string,"created_by"?: string | null,"financial_year": string,"id"?: string,"igst_paise"?: number,"invoice_number": string,"issued_at"?: string,"lines"?: NonNullable<Json>,"order_id": string,"pdf_path"?: string | null,"place_of_supply_state_code"?: string | null,"seller_gstin"?: string | null,"sgst_paise"?: number,"taxable_paise": number,"total_paise": number
                  }
                  Update: {
                    "buyer_gstin"?: string | null,"buyer_name"?: string | null,"cgst_paise"?: number,"created_at"?: string,"created_by"?: string | null,"financial_year"?: string,"id"?: string,"igst_paise"?: number,"invoice_number"?: string,"issued_at"?: string,"lines"?: NonNullable<Json>,"order_id"?: string,"pdf_path"?: string | null,"place_of_supply_state_code"?: string | null,"seller_gstin"?: string | null,"sgst_paise"?: number,"taxable_paise"?: number,"total_paise"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoices_order_id_fkey"
      columns: ["order_id"]
isOneToOne: true
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"label_usage_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"id": number,"label_id": string,"note": string | null,"order_id": string | null,"product_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"id"?: never,"label_id": string,"note"?: string | null,"order_id"?: string | null,"product_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"id"?: never,"label_id"?: string,"note"?: string | null,"order_id"?: string | null,"product_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "label_usage_log_label_id_fkey"
      columns: ["label_id"]
isOneToOne: false
      referencedRelation: "authenticity_labels"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "label_usage_log_order_fk"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "label_usage_log_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"lookbook_items": {
                  Row: {
                    "alt": string,"caption": string | null,"created_at": string,"id": string,"image_path": string,"lookbook_id": string,"position": number,"product_ids": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: string,"caption"?: string | null,"created_at"?: string,"id"?: string,"image_path": string,"lookbook_id": string,"position"?: number,"product_ids"?: (string)[]
                  }
                  Update: {
                    "alt"?: string,"caption"?: string | null,"created_at"?: string,"id"?: string,"image_path"?: string,"lookbook_id"?: string,"position"?: number,"product_ids"?: (string)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "lookbook_items_lookbook_id_fkey"
      columns: ["lookbook_id"]
isOneToOne: false
      referencedRelation: "lookbooks"
      referencedColumns: ["id"]
    }
                  ]
                },"lookbooks": {
                  Row: {
                    "cover_image_path": string | null,"created_at": string,"id": string,"intro": string | null,"published_at": string | null,"scheduled_at": string | null,"seo_description": string | null,"seo_title": string | null,"slug": string,"status": Database["public"]['Enums']["publish_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_image_path"?: string | null,"created_at"?: string,"id"?: string,"intro"?: string | null,"published_at"?: string | null,"scheduled_at"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["publish_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "cover_image_path"?: string | null,"created_at"?: string,"id"?: string,"intro"?: string | null,"published_at"?: string | null,"scheduled_at"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["publish_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"looms": {
                  Row: {
                    "active": boolean,"code": string,"created_at": string,"id": string,"locality": string | null,"loom_type": string | null,"notes": string | null,"updated_at": string,"weaver_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"code": string,"created_at"?: string,"id"?: string,"locality"?: string | null,"loom_type"?: string | null,"notes"?: string | null,"updated_at"?: string,"weaver_id"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"code"?: string,"created_at"?: string,"id"?: string,"locality"?: string | null,"loom_type"?: string | null,"notes"?: string | null,"updated_at"?: string,"weaver_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "looms_weaver_id_fkey"
      columns: ["weaver_id"]
isOneToOne: false
      referencedRelation: "weavers"
      referencedColumns: ["id"]
    }
                  ]
                },"media_assets": {
                  Row: {
                    "alt": string,"bucket": string,"bytes": number | null,"created_at": string,"height": number | null,"id": string,"kind": string,"mime_type": string | null,"sizes": NonNullable<Json>,"storage_path": string,"uploaded_by": string | null,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: string,"bucket"?: string,"bytes"?: number | null,"created_at"?: string,"height"?: number | null,"id"?: string,"kind"?: string,"mime_type"?: string | null,"sizes"?: NonNullable<Json>,"storage_path": string,"uploaded_by"?: string | null,"width"?: number | null
                  }
                  Update: {
                    "alt"?: string,"bucket"?: string,"bytes"?: number | null,"created_at"?: string,"height"?: number | null,"id"?: string,"kind"?: string,"mime_type"?: string | null,"sizes"?: NonNullable<Json>,"storage_path"?: string,"uploaded_by"?: string | null,"width"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"navigation_menus": {
                  Row: {
                    "handle": string,"items": NonNullable<Json>,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "handle": string,"items"?: NonNullable<Json>,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "handle"?: string,"items"?: NonNullable<Json>,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notification_outbox": {
                  Row: {
                    "attempts": number,"channel": string,"created_at": string,"customer_id": string | null,"dedupe_key": string | null,"id": string,"last_error": string | null,"order_id": string | null,"payload": NonNullable<Json>,"send_after": string,"sent_at": string | null,"status": string,"template": string,"to_email": string | null,"to_phone": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "attempts"?: number,"channel": string,"created_at"?: string,"customer_id"?: string | null,"dedupe_key"?: string | null,"id"?: string,"last_error"?: string | null,"order_id"?: string | null,"payload"?: NonNullable<Json>,"send_after"?: string,"sent_at"?: string | null,"status"?: string,"template": string,"to_email"?: string | null,"to_phone"?: string | null
                  }
                  Update: {
                    "attempts"?: number,"channel"?: string,"created_at"?: string,"customer_id"?: string | null,"dedupe_key"?: string | null,"id"?: string,"last_error"?: string | null,"order_id"?: string | null,"payload"?: NonNullable<Json>,"send_after"?: string,"sent_at"?: string | null,"status"?: string,"template"?: string,"to_email"?: string | null,"to_phone"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "notification_outbox_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notification_outbox_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "colour": string | null,"compare_at_paise": number | null,"created_at": string,"discount_paise": number,"gi_eligible": boolean,"gst_rate_bps": number,"handloom_mark_label_number": string | null,"hsn_code": string,"id": string,"image_path": string | null,"is_one_of_a_kind": boolean,"is_swatch": boolean,"line_total_paise": number,"order_id": string,"product_id": string | null,"quantity": number,"returnable": boolean,"sell_unit": Database["public"]['Enums']["sell_unit"],"silk_mark_label_number": string | null,"sku": string,"tax_paise": number,"title": string,"unit_price_paise": number,"variant_id": string | null,"variant_title": string | null,"weaver_name": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "colour"?: string | null,"compare_at_paise"?: number | null,"created_at"?: string,"discount_paise"?: number,"gi_eligible"?: boolean,"gst_rate_bps": number,"handloom_mark_label_number"?: string | null,"hsn_code": string,"id"?: string,"image_path"?: string | null,"is_one_of_a_kind"?: boolean,"is_swatch"?: boolean,"line_total_paise": number,"order_id": string,"product_id"?: string | null,"quantity": number,"returnable"?: boolean,"sell_unit": Database["public"]['Enums']["sell_unit"],"silk_mark_label_number"?: string | null,"sku": string,"tax_paise"?: number,"title": string,"unit_price_paise": number,"variant_id"?: string | null,"variant_title"?: string | null,"weaver_name"?: string | null
                  }
                  Update: {
                    "colour"?: string | null,"compare_at_paise"?: number | null,"created_at"?: string,"discount_paise"?: number,"gi_eligible"?: boolean,"gst_rate_bps"?: number,"handloom_mark_label_number"?: string | null,"hsn_code"?: string,"id"?: string,"image_path"?: string | null,"is_one_of_a_kind"?: boolean,"is_swatch"?: boolean,"line_total_paise"?: number,"order_id"?: string,"product_id"?: string | null,"quantity"?: number,"returnable"?: boolean,"sell_unit"?: Database["public"]['Enums']["sell_unit"],"silk_mark_label_number"?: string | null,"sku"?: string,"tax_paise"?: number,"title"?: string,"unit_price_paise"?: number,"variant_id"?: string | null,"variant_title"?: string | null,"weaver_name"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"order_notes": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"customer_visible": boolean,"id": string,"order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"customer_visible"?: boolean,"id"?: string,"order_id": string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"customer_visible"?: boolean,"id"?: string,"order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_notes_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_status_history": {
                  Row: {
                    "changed_by": string | null,"created_at": string,"from_status": Database["public"]['Enums']["order_status"] | null,"id": number,"note": string | null,"order_id": string,"to_status": Database["public"]['Enums']["order_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_by"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["order_status"] | null,"id"?: never,"note"?: string | null,"order_id": string,"to_status": Database["public"]['Enums']["order_status"]
                  }
                  Update: {
                    "changed_by"?: string | null,"created_at"?: string,"from_status"?: Database["public"]['Enums']["order_status"] | null,"id"?: never,"note"?: string | null,"order_id"?: string,"to_status"?: Database["public"]['Enums']["order_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_status_history_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "billing_address": Json | null,"business_name": string | null,"cancel_reason": string | null,"cancelled_at": string | null,"cart_id": string | null,"cod_confirmed_at": string | null,"cod_confirmed_by": string | null,"cod_fee_paise": number,"confirmed_at": string | null,"coupon_code": string | null,"created_at": string,"created_by": string | null,"currency": string,"customer_id": string | null,"customer_note": string | null,"delivered_at": string | null,"discount_paise": number,"email": string | null,"gift_card_paise": number,"gift_message": string | null,"gift_wrap": boolean,"gift_wrap_paise": number,"gstin": string | null,"id": string,"order_number": string,"payment_method": Database["public"]['Enums']["payment_method"] | null,"payment_status": Database["public"]['Enums']["payment_status"],"phone": string | null,"place_of_supply_state_code": string | null,"placed_at": string,"razorpay_order_id": string | null,"shipped_at": string | null,"shipping_address": NonNullable<Json>,"shipping_paise": number,"source": string,"status": Database["public"]['Enums']["order_status"],"subtotal_paise": number,"tax_paise": number,"total_paise": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "billing_address"?: Json | null,"business_name"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"cart_id"?: string | null,"cod_confirmed_at"?: string | null,"cod_confirmed_by"?: string | null,"cod_fee_paise"?: number,"confirmed_at"?: string | null,"coupon_code"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"customer_id"?: string | null,"customer_note"?: string | null,"delivered_at"?: string | null,"discount_paise"?: number,"email"?: string | null,"gift_card_paise"?: number,"gift_message"?: string | null,"gift_wrap"?: boolean,"gift_wrap_paise"?: number,"gstin"?: string | null,"id"?: string,"order_number"?: string,"payment_method"?: Database["public"]['Enums']["payment_method"] | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"phone"?: string | null,"place_of_supply_state_code"?: string | null,"placed_at"?: string,"razorpay_order_id"?: string | null,"shipped_at"?: string | null,"shipping_address": NonNullable<Json>,"shipping_paise"?: number,"source"?: string,"status"?: Database["public"]['Enums']["order_status"],"subtotal_paise": number,"tax_paise"?: number,"total_paise": number,"updated_at"?: string
                  }
                  Update: {
                    "billing_address"?: Json | null,"business_name"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"cart_id"?: string | null,"cod_confirmed_at"?: string | null,"cod_confirmed_by"?: string | null,"cod_fee_paise"?: number,"confirmed_at"?: string | null,"coupon_code"?: string | null,"created_at"?: string,"created_by"?: string | null,"currency"?: string,"customer_id"?: string | null,"customer_note"?: string | null,"delivered_at"?: string | null,"discount_paise"?: number,"email"?: string | null,"gift_card_paise"?: number,"gift_message"?: string | null,"gift_wrap"?: boolean,"gift_wrap_paise"?: number,"gstin"?: string | null,"id"?: string,"order_number"?: string,"payment_method"?: Database["public"]['Enums']["payment_method"] | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"phone"?: string | null,"place_of_supply_state_code"?: string | null,"placed_at"?: string,"razorpay_order_id"?: string | null,"shipped_at"?: string | null,"shipping_address"?: NonNullable<Json>,"shipping_paise"?: number,"source"?: string,"status"?: Database["public"]['Enums']["order_status"],"subtotal_paise"?: number,"tax_paise"?: number,"total_paise"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_cart_id_fkey"
      columns: ["cart_id"]
isOneToOne: false
      referencedRelation: "carts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "orders_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    }
                  ]
                },"page_versions": {
                  Row: {
                    "body_html": string,"body_json": Json | null,"change_summary": string | null,"created_at": string,"created_by": string | null,"effective_from": string | null,"id": string,"page_id": string,"title": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "body_html": string,"body_json"?: Json | null,"change_summary"?: string | null,"created_at"?: string,"created_by"?: string | null,"effective_from"?: string | null,"id"?: string,"page_id": string,"title": string,"version": number
                  }
                  Update: {
                    "body_html"?: string,"body_json"?: Json | null,"change_summary"?: string | null,"created_at"?: string,"created_by"?: string | null,"effective_from"?: string | null,"id"?: string,"page_id"?: string,"title"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "page_versions_page_id_fkey"
      columns: ["page_id"]
isOneToOne: false
      referencedRelation: "pages"
      referencedColumns: ["id"]
    }
                  ]
                },"pages": {
                  Row: {
                    "created_at": string,"current_version_id": string | null,"id": string,"kind": string,"noindex": boolean,"published_at": string | null,"scheduled_at": string | null,"seo_description": string | null,"seo_title": string | null,"slug": string,"status": Database["public"]['Enums']["publish_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"current_version_id"?: string | null,"id"?: string,"kind": string,"noindex"?: boolean,"published_at"?: string | null,"scheduled_at"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["publish_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"current_version_id"?: string | null,"id"?: string,"kind"?: string,"noindex"?: boolean,"published_at"?: string | null,"scheduled_at"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["publish_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pages_current_version_fk"
      columns: ["current_version_id"]
isOneToOne: false
      referencedRelation: "page_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"payments": {
                  Row: {
                    "amount_paise": number,"captured_at": string | null,"created_at": string,"error_code": string | null,"error_description": string | null,"id": string,"method": Database["public"]['Enums']["payment_method"] | null,"order_id": string,"provider": string,"raw_payload": Json | null,"razorpay_order_id": string | null,"razorpay_payment_id": string | null,"razorpay_signature": string | null,"status": Database["public"]['Enums']["payment_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_paise": number,"captured_at"?: string | null,"created_at"?: string,"error_code"?: string | null,"error_description"?: string | null,"id"?: string,"method"?: Database["public"]['Enums']["payment_method"] | null,"order_id": string,"provider"?: string,"raw_payload"?: Json | null,"razorpay_order_id"?: string | null,"razorpay_payment_id"?: string | null,"razorpay_signature"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"updated_at"?: string
                  }
                  Update: {
                    "amount_paise"?: number,"captured_at"?: string | null,"created_at"?: string,"error_code"?: string | null,"error_description"?: string | null,"id"?: string,"method"?: Database["public"]['Enums']["payment_method"] | null,"order_id"?: string,"provider"?: string,"raw_payload"?: Json | null,"razorpay_order_id"?: string | null,"razorpay_payment_id"?: string | null,"razorpay_signature"?: string | null,"status"?: Database["public"]['Enums']["payment_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "payments_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"price_history": {
                  Row: {
                    "changed_by": string | null,"compare_at_paise": number | null,"effective_from": string,"effective_to": string | null,"id": string,"price_paise": number,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_by"?: string | null,"compare_at_paise"?: number | null,"effective_from"?: string,"effective_to"?: string | null,"id"?: string,"price_paise": number,"variant_id": string
                  }
                  Update: {
                    "changed_by"?: string | null,"compare_at_paise"?: number | null,"effective_from"?: string,"effective_to"?: string | null,"id"?: string,"price_paise"?: number,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "price_history_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"product_media": {
                  Row: {
                    "alt": string,"created_at": string,"height": number | null,"id": string,"kind": string,"poster_path": string | null,"product_id": string,"sort": number,"storage_path": string,"variant_id": string | null,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: string,"created_at"?: string,"height"?: number | null,"id"?: string,"kind"?: string,"poster_path"?: string | null,"product_id": string,"sort"?: number,"storage_path": string,"variant_id"?: string | null,"width"?: number | null
                  }
                  Update: {
                    "alt"?: string,"created_at"?: string,"height"?: number | null,"id"?: string,"kind"?: string,"poster_path"?: string | null,"product_id"?: string,"sort"?: number,"storage_path"?: string,"variant_id"?: string | null,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_media_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "product_media_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"product_variants": {
                  Row: {
                    "active": boolean,"colour": string | null,"colour_hex": string | null,"compare_at_paise": number | null,"created_at": string,"id": string,"max_qty": number | null,"min_qty": number,"position": number,"price_paise": number,"product_id": string,"sell_unit": Database["public"]['Enums']["sell_unit"],"sku": string,"step_qty": number,"title": string | null,"updated_at": string,"weight_g": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"colour"?: string | null,"colour_hex"?: string | null,"compare_at_paise"?: number | null,"created_at"?: string,"id"?: string,"max_qty"?: number | null,"min_qty"?: number,"position"?: number,"price_paise": number,"product_id": string,"sell_unit"?: Database["public"]['Enums']["sell_unit"],"sku": string,"step_qty"?: number,"title"?: string | null,"updated_at"?: string,"weight_g"?: number | null
                  }
                  Update: {
                    "active"?: boolean,"colour"?: string | null,"colour_hex"?: string | null,"compare_at_paise"?: number | null,"created_at"?: string,"id"?: string,"max_qty"?: number | null,"min_qty"?: number,"position"?: number,"price_paise"?: number,"product_id"?: string,"sell_unit"?: Database["public"]['Enums']["sell_unit"],"sku"?: string,"step_qty"?: number,"title"?: string | null,"updated_at"?: string,"weight_g"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_variants_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "blouse_included": boolean,"blouse_length_m": number | null,"care": string | null,"composition": string,"created_at": string,"created_by": string | null,"description": string | null,"featured_rank": number | null,"fibre_warp": Database["public"]['Enums']["fibre"] | null,"fibre_weft": Database["public"]['Enums']["fibre"] | null,"gi_eligible": boolean,"gst_rate_bps": number,"hsn_code": string,"id": string,"is_one_of_a_kind": boolean,"kind": Database["public"]['Enums']["product_kind"],"lead_time_days": number | null,"length_m": number | null,"loom_id": string | null,"made_to_order": boolean,"noindex": boolean,"occasions": (Database["public"]['Enums']["occasion"])[],"og_image_path": string | null,"price_max_paise": number | null,"price_min_paise": number | null,"primary_fibre": Database["public"]['Enums']["fibre"],"published_at": string | null,"rating_avg": number | null,"rating_count": number,"returnable": boolean,"scheduled_at": string | null,"search_vector": unknown,"seo_description": string | null,"seo_title": string | null,"slug": string,"status": Database["public"]['Enums']["publish_status"],"subtitle": string | null,"swatch_available": boolean,"swatch_price_paise": number | null,"tags": (string)[],"title": string,"updated_at": string,"weave": string | null,"weaver_id": string | null,"weight_g": number | null,"width_cm": number | null,"zari": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "blouse_included"?: boolean,"blouse_length_m"?: number | null,"care"?: string | null,"composition": string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"featured_rank"?: number | null,"fibre_warp"?: Database["public"]['Enums']["fibre"] | null,"fibre_weft"?: Database["public"]['Enums']["fibre"] | null,"gi_eligible"?: boolean,"gst_rate_bps"?: number,"hsn_code": string,"id"?: string,"is_one_of_a_kind"?: boolean,"kind": Database["public"]['Enums']["product_kind"],"lead_time_days"?: number | null,"length_m"?: number | null,"loom_id"?: string | null,"made_to_order"?: boolean,"noindex"?: boolean,"occasions"?: (Database["public"]['Enums']["occasion"])[],"og_image_path"?: string | null,"price_max_paise"?: number | null,"price_min_paise"?: number | null,"primary_fibre": Database["public"]['Enums']["fibre"],"published_at"?: string | null,"rating_avg"?: number | null,"rating_count"?: number,"returnable"?: boolean,"scheduled_at"?: string | null,"search_vector"?: unknown,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"status"?: Database["public"]['Enums']["publish_status"],"subtitle"?: string | null,"swatch_available"?: boolean,"swatch_price_paise"?: number | null,"tags"?: (string)[],"title": string,"updated_at"?: string,"weave"?: string | null,"weaver_id"?: string | null,"weight_g"?: number | null,"width_cm"?: number | null,"zari"?: string | null
                  }
                  Update: {
                    "blouse_included"?: boolean,"blouse_length_m"?: number | null,"care"?: string | null,"composition"?: string,"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"featured_rank"?: number | null,"fibre_warp"?: Database["public"]['Enums']["fibre"] | null,"fibre_weft"?: Database["public"]['Enums']["fibre"] | null,"gi_eligible"?: boolean,"gst_rate_bps"?: number,"hsn_code"?: string,"id"?: string,"is_one_of_a_kind"?: boolean,"kind"?: Database["public"]['Enums']["product_kind"],"lead_time_days"?: number | null,"length_m"?: number | null,"loom_id"?: string | null,"made_to_order"?: boolean,"noindex"?: boolean,"occasions"?: (Database["public"]['Enums']["occasion"])[],"og_image_path"?: string | null,"price_max_paise"?: number | null,"price_min_paise"?: number | null,"primary_fibre"?: Database["public"]['Enums']["fibre"],"published_at"?: string | null,"rating_avg"?: number | null,"rating_count"?: number,"returnable"?: boolean,"scheduled_at"?: string | null,"search_vector"?: unknown,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"status"?: Database["public"]['Enums']["publish_status"],"subtitle"?: string | null,"swatch_available"?: boolean,"swatch_price_paise"?: number | null,"tags"?: (string)[],"title"?: string,"updated_at"?: string,"weave"?: string | null,"weaver_id"?: string | null,"weight_g"?: number | null,"width_cm"?: number | null,"zari"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_loom_id_fkey"
      columns: ["loom_id"]
isOneToOne: false
      referencedRelation: "looms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_weaver_id_fkey"
      columns: ["weaver_id"]
isOneToOne: false
      referencedRelation: "weavers"
      referencedColumns: ["id"]
    }
                  ]
                },"redirects": {
                  Row: {
                    "created_at": string,"created_by": string | null,"from_path": string,"hits": number,"id": string,"status_code": number,"to_path": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"from_path": string,"hits"?: number,"id"?: string,"status_code"?: number,"to_path": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"from_path"?: string,"hits"?: number,"id"?: string,"status_code"?: number,"to_path"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"refunds": {
                  Row: {
                    "amount_paise": number,"created_at": string,"created_by": string | null,"id": string,"method": string,"order_id": string,"payment_id": string | null,"processed_at": string | null,"raw_payload": Json | null,"razorpay_refund_id": string | null,"reason": string | null,"return_id": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_paise": number,"created_at"?: string,"created_by"?: string | null,"id"?: string,"method"?: string,"order_id": string,"payment_id"?: string | null,"processed_at"?: string | null,"raw_payload"?: Json | null,"razorpay_refund_id"?: string | null,"reason"?: string | null,"return_id"?: string | null,"status"?: string
                  }
                  Update: {
                    "amount_paise"?: number,"created_at"?: string,"created_by"?: string | null,"id"?: string,"method"?: string,"order_id"?: string,"payment_id"?: string | null,"processed_at"?: string | null,"raw_payload"?: Json | null,"razorpay_refund_id"?: string | null,"reason"?: string | null,"return_id"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "refunds_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "refunds_payment_id_fkey"
      columns: ["payment_id"]
isOneToOne: false
      referencedRelation: "payments"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "refunds_return_id_fkey"
      columns: ["return_id"]
isOneToOne: false
      referencedRelation: "returns"
      referencedColumns: ["id"]
    }
                  ]
                },"return_items": {
                  Row: {
                    "created_at": string,"disposition": string | null,"id": string,"order_item_id": string,"qc_result": string | null,"quantity": number,"reason": string | null,"return_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"disposition"?: string | null,"id"?: string,"order_item_id": string,"qc_result"?: string | null,"quantity": number,"reason"?: string | null,"return_id": string
                  }
                  Update: {
                    "created_at"?: string,"disposition"?: string | null,"id"?: string,"order_item_id"?: string,"qc_result"?: string | null,"quantity"?: number,"reason"?: string | null,"return_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "return_items_order_item_id_fkey"
      columns: ["order_item_id"]
isOneToOne: false
      referencedRelation: "order_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "return_items_return_id_fkey"
      columns: ["return_id"]
isOneToOne: false
      referencedRelation: "returns"
      referencedColumns: ["id"]
    }
                  ]
                },"returns": {
                  Row: {
                    "created_at": string,"customer_comment": string | null,"customer_id": string | null,"decided_at": string | null,"decided_by": string | null,"id": string,"order_id": string,"pickup_scheduled_at": string | null,"qc_by": string | null,"qc_notes": string | null,"reason": string,"received_at": string | null,"rejection_reason": string | null,"resolution": Database["public"]['Enums']["return_resolution"],"reverse_awb": string | null,"reverse_courier": string | null,"status": Database["public"]['Enums']["return_status"],"unboxing_video_path": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_comment"?: string | null,"customer_id"?: string | null,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: string,"order_id": string,"pickup_scheduled_at"?: string | null,"qc_by"?: string | null,"qc_notes"?: string | null,"reason": string,"received_at"?: string | null,"rejection_reason"?: string | null,"resolution"?: Database["public"]['Enums']["return_resolution"],"reverse_awb"?: string | null,"reverse_courier"?: string | null,"status"?: Database["public"]['Enums']["return_status"],"unboxing_video_path"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"customer_comment"?: string | null,"customer_id"?: string | null,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: string,"order_id"?: string,"pickup_scheduled_at"?: string | null,"qc_by"?: string | null,"qc_notes"?: string | null,"reason"?: string,"received_at"?: string | null,"rejection_reason"?: string | null,"resolution"?: Database["public"]['Enums']["return_resolution"],"reverse_awb"?: string | null,"reverse_courier"?: string | null,"status"?: Database["public"]['Enums']["return_status"],"unboxing_video_path"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "returns_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "returns_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"reviews": {
                  Row: {
                    "author_city": string | null,"author_name": string,"body": string,"created_at": string,"customer_id": string | null,"id": string,"moderated_at": string | null,"moderated_by": string | null,"order_item_id": string | null,"photos": (string)[],"product_id": string,"rating": number,"replied_at": string | null,"replied_by": string | null,"reply_body": string | null,"status": Database["public"]['Enums']["review_status"],"title": string | null,"updated_at": string,"verified_purchase": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "author_city"?: string | null,"author_name": string,"body": string,"created_at"?: string,"customer_id"?: string | null,"id"?: string,"moderated_at"?: string | null,"moderated_by"?: string | null,"order_item_id"?: string | null,"photos"?: (string)[],"product_id": string,"rating": number,"replied_at"?: string | null,"replied_by"?: string | null,"reply_body"?: string | null,"status"?: Database["public"]['Enums']["review_status"],"title"?: string | null,"updated_at"?: string,"verified_purchase"?: boolean
                  }
                  Update: {
                    "author_city"?: string | null,"author_name"?: string,"body"?: string,"created_at"?: string,"customer_id"?: string | null,"id"?: string,"moderated_at"?: string | null,"moderated_by"?: string | null,"order_item_id"?: string | null,"photos"?: (string)[],"product_id"?: string,"rating"?: number,"replied_at"?: string | null,"replied_by"?: string | null,"reply_body"?: string | null,"status"?: Database["public"]['Enums']["review_status"],"title"?: string | null,"updated_at"?: string,"verified_purchase"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "reviews_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_order_item_id_fkey"
      columns: ["order_item_id"]
isOneToOne: false
      referencedRelation: "order_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reviews_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"serviceable_pincodes": {
                  Row: {
                    "active": boolean,"city": string,"cod_available": boolean,"district": string | null,"est_days_max": number,"est_days_min": number,"pincode": string,"prepaid_available": boolean,"state": string,"state_code": string | null,"updated_at": string,"zone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"city": string,"cod_available"?: boolean,"district"?: string | null,"est_days_max": number,"est_days_min": number,"pincode": string,"prepaid_available"?: boolean,"state": string,"state_code"?: string | null,"updated_at"?: string,"zone": string
                  }
                  Update: {
                    "active"?: boolean,"city"?: string,"cod_available"?: boolean,"district"?: string | null,"est_days_max"?: number,"est_days_min"?: number,"pincode"?: string,"prepaid_available"?: boolean,"state"?: string,"state_code"?: string | null,"updated_at"?: string,"zone"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "serviceable_pincodes_zone_fkey"
      columns: ["zone"]
isOneToOne: false
      referencedRelation: "shipping_zones"
      referencedColumns: ["code"]
    }
                  ]
                },"settings": {
                  Row: {
                    "description": string | null,"is_public": boolean,"key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"is_public"?: boolean,"key": string,"updated_at"?: string,"updated_by"?: string | null,"value": NonNullable<Json>
                  }
                  Update: {
                    "description"?: string | null,"is_public"?: boolean,"key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"shipment_events": {
                  Row: {
                    "created_at": string,"description": string | null,"id": number,"location": string | null,"occurred_at": string,"raw": Json | null,"shipment_id": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"id"?: never,"location"?: string | null,"occurred_at": string,"raw"?: Json | null,"shipment_id": string,"status": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"id"?: never,"location"?: string | null,"occurred_at"?: string,"raw"?: Json | null,"shipment_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shipment_events_shipment_id_fkey"
      columns: ["shipment_id"]
isOneToOne: false
      referencedRelation: "shipments"
      referencedColumns: ["id"]
    }
                  ]
                },"shipment_items": {
                  Row: {
                    "order_item_id": string,"quantity": number,"shipment_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "order_item_id": string,"quantity": number,"shipment_id": string
                  }
                  Update: {
                    "order_item_id"?: string,"quantity"?: number,"shipment_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shipment_items_order_item_id_fkey"
      columns: ["order_item_id"]
isOneToOne: false
      referencedRelation: "order_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "shipment_items_shipment_id_fkey"
      columns: ["shipment_id"]
isOneToOne: false
      referencedRelation: "shipments"
      referencedColumns: ["id"]
    }
                  ]
                },"shipments": {
                  Row: {
                    "awb": string | null,"cod_amount_paise": number,"courier": string | null,"created_at": string,"created_by": string | null,"delivered_at": string | null,"dimensions_cm": Json | null,"id": string,"insured_value_paise": number | null,"label_path": string | null,"ndr_count": number,"ndr_last_at": string | null,"ndr_reason": string | null,"order_id": string,"pickup_scheduled_at": string | null,"rto_initiated_at": string | null,"rto_received_at": string | null,"service": string | null,"shipped_at": string | null,"status": string,"tracking_url": string | null,"updated_at": string,"weight_g": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "awb"?: string | null,"cod_amount_paise"?: number,"courier"?: string | null,"created_at"?: string,"created_by"?: string | null,"delivered_at"?: string | null,"dimensions_cm"?: Json | null,"id"?: string,"insured_value_paise"?: number | null,"label_path"?: string | null,"ndr_count"?: number,"ndr_last_at"?: string | null,"ndr_reason"?: string | null,"order_id": string,"pickup_scheduled_at"?: string | null,"rto_initiated_at"?: string | null,"rto_received_at"?: string | null,"service"?: string | null,"shipped_at"?: string | null,"status"?: string,"tracking_url"?: string | null,"updated_at"?: string,"weight_g"?: number | null
                  }
                  Update: {
                    "awb"?: string | null,"cod_amount_paise"?: number,"courier"?: string | null,"created_at"?: string,"created_by"?: string | null,"delivered_at"?: string | null,"dimensions_cm"?: Json | null,"id"?: string,"insured_value_paise"?: number | null,"label_path"?: string | null,"ndr_count"?: number,"ndr_last_at"?: string | null,"ndr_reason"?: string | null,"order_id"?: string,"pickup_scheduled_at"?: string | null,"rto_initiated_at"?: string | null,"rto_received_at"?: string | null,"service"?: string | null,"shipped_at"?: string | null,"status"?: string,"tracking_url"?: string | null,"updated_at"?: string,"weight_g"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "shipments_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"shipping_zones": {
                  Row: {
                    "active": boolean,"code": string,"express_rate_paise": number | null,"name": string,"standard_rate_paise": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"code": string,"express_rate_paise"?: number | null,"name": string,"standard_rate_paise": number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"code"?: string,"express_rate_paise"?: number | null,"name"?: string,"standard_rate_paise"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"staff_members": {
                  Row: {
                    "active": boolean,"created_at": string,"display_name": string,"email": string,"invited_by": string | null,"role": Database["public"]['Enums']["staff_role"],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"display_name": string,"email": string,"invited_by"?: string | null,"role": Database["public"]['Enums']["staff_role"],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"display_name"?: string,"email"?: string,"invited_by"?: string | null,"role"?: Database["public"]['Enums']["staff_role"],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"stock_adjustments": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"delta": number,"id": number,"location_id": string,"note": string | null,"order_id": string | null,"reason": Database["public"]['Enums']["stock_adjustment_reason"],"return_id": string | null,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"delta": number,"id"?: never,"location_id": string,"note"?: string | null,"order_id"?: string | null,"reason": Database["public"]['Enums']["stock_adjustment_reason"],"return_id"?: string | null,"variant_id": string
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"delta"?: number,"id"?: never,"location_id"?: string,"note"?: string | null,"order_id"?: string | null,"reason"?: Database["public"]['Enums']["stock_adjustment_reason"],"return_id"?: string | null,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_adjustments_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "stock_locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_adjustments_order_fk"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_adjustments_return_fk"
      columns: ["return_id"]
isOneToOne: false
      referencedRelation: "returns"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_adjustments_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"stock_locations": {
                  Row: {
                    "active": boolean,"address": string | null,"code": string,"created_at": string,"id": string,"is_default": boolean,"name": string,"sellable": boolean,"type": Database["public"]['Enums']["stock_location_type"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"address"?: string | null,"code": string,"created_at"?: string,"id"?: string,"is_default"?: boolean,"name": string,"sellable"?: boolean,"type": Database["public"]['Enums']["stock_location_type"],"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"address"?: string | null,"code"?: string,"created_at"?: string,"id"?: string,"is_default"?: boolean,"name"?: string,"sellable"?: boolean,"type"?: Database["public"]['Enums']["stock_location_type"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"stock_reservations": {
                  Row: {
                    "checkout_id": string,"committed_at": string | null,"created_at": string,"expires_at": string,"id": string,"location_id": string,"quantity": number,"released_at": string | null,"status": Database["public"]['Enums']["reservation_status"],"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checkout_id": string,"committed_at"?: string | null,"created_at"?: string,"expires_at": string,"id"?: string,"location_id": string,"quantity": number,"released_at"?: string | null,"status"?: Database["public"]['Enums']["reservation_status"],"variant_id": string
                  }
                  Update: {
                    "checkout_id"?: string,"committed_at"?: string | null,"created_at"?: string,"expires_at"?: string,"id"?: string,"location_id"?: string,"quantity"?: number,"released_at"?: string | null,"status"?: Database["public"]['Enums']["reservation_status"],"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "stock_reservations_location_id_fkey"
      columns: ["location_id"]
isOneToOne: false
      referencedRelation: "stock_locations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "stock_reservations_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"variant_price_tiers": {
                  Row: {
                    "created_at": string,"id": string,"min_qty": number,"price_paise": number,"variant_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"min_qty": number,"price_paise": number,"variant_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"min_qty"?: number,"price_paise"?: number,"variant_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "variant_price_tiers_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"waitlist_subscribers": {
                  Row: {
                    "collection_id": string | null,"created_at": string,"customer_id": string | null,"email": string,"id": string,"notified_at": string | null,"phone": string | null,"product_id": string | null,"unsubscribed_at": string | null,"variant_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "collection_id"?: string | null,"created_at"?: string,"customer_id"?: string | null,"email": string,"id"?: string,"notified_at"?: string | null,"phone"?: string | null,"product_id"?: string | null,"unsubscribed_at"?: string | null,"variant_id"?: string | null
                  }
                  Update: {
                    "collection_id"?: string | null,"created_at"?: string,"customer_id"?: string | null,"email"?: string,"id"?: string,"notified_at"?: string | null,"phone"?: string | null,"product_id"?: string | null,"unsubscribed_at"?: string | null,"variant_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "waitlist_subscribers_collection_id_fkey"
      columns: ["collection_id"]
isOneToOne: false
      referencedRelation: "collections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "waitlist_subscribers_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "waitlist_subscribers_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "waitlist_subscribers_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                },"weavers": {
                  Row: {
                    "bio": string | null,"created_at": string,"id": string,"is_sample": boolean,"locality": string | null,"name": string,"portrait_path": string | null,"scheduled_at": string | null,"seo_description": string | null,"seo_title": string | null,"slug": string,"specialities": (Database["public"]['Enums']["fibre"])[],"status": Database["public"]['Enums']["publish_status"],"updated_at": string,"years_weaving": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bio"?: string | null,"created_at"?: string,"id"?: string,"is_sample"?: boolean,"locality"?: string | null,"name": string,"portrait_path"?: string | null,"scheduled_at"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"specialities"?: (Database["public"]['Enums']["fibre"])[],"status"?: Database["public"]['Enums']["publish_status"],"updated_at"?: string,"years_weaving"?: number | null
                  }
                  Update: {
                    "bio"?: string | null,"created_at"?: string,"id"?: string,"is_sample"?: boolean,"locality"?: string | null,"name"?: string,"portrait_path"?: string | null,"scheduled_at"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"specialities"?: (Database["public"]['Enums']["fibre"])[],"status"?: Database["public"]['Enums']["publish_status"],"updated_at"?: string,"years_weaving"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"webhook_events": {
                  Row: {
                    "error": string | null,"event_id": string,"event_type": string,"id": number,"payload": NonNullable<Json>,"processed_at": string | null,"provider": string,"received_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "error"?: string | null,"event_id": string,"event_type": string,"id"?: never,"payload": NonNullable<Json>,"processed_at"?: string | null,"provider": string,"received_at"?: string
                  }
                  Update: {
                    "error"?: string | null,"event_id"?: string,"event_type"?: string,"id"?: never,"payload"?: NonNullable<Json>,"processed_at"?: string | null,"provider"?: string,"received_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"wishlist_items": {
                  Row: {
                    "created_at": string,"customer_id": string,"product_id": string,"variant_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"customer_id": string,"product_id": string,"variant_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"customer_id"?: string,"product_id"?: string,"variant_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "wishlist_items_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "wishlist_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "wishlist_items_variant_id_fkey"
      columns: ["variant_id"]
isOneToOne: false
      referencedRelation: "product_variants"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "apply_stock_adjustment":
{ Args: { "p_delta": number,"p_location_id": string,"p_note"?: string,"p_reason": Database["public"]['Enums']["stock_adjustment_reason"],"p_return_id"?: string,"p_variant_id": string }; Returns: {
              "location_id": string,
"low_stock_threshold": number | null,
"on_hand": number,
"reserved": number,
"updated_at": string,
"variant_id": string
            }
                          SetofOptions: {
        from: "*"
        to: "inventory_levels"
        isOneToOne: true
        isSetofReturn: false
      } },
"assert_trusted_or_staff":
{ Args: { "p_roles": (Database["public"]['Enums']["staff_role"])[] }; Returns: undefined
                           },
"commit_reservation":
{ Args: { "p_checkout_id": string }; Returns: number
                           },
"current_consents":
{ Args: Record<PropertyKey, never>; Returns: {
              "granted": boolean,"notice_version": string,"purpose": Database["public"]['Enums']["consent_purpose"],"recorded_at": string
            }[]
                           },
"current_customer_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"current_staff_role":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["staff_role"]
                           },
"financial_year_label":
{ Args: { "p_at"?: string }; Returns: string
                           },
"has_staff_role":
{ Args: { "p_roles": (Database["public"]['Enums']["staff_role"])[] }; Returns: boolean
                           },
"is_live":
{ Args: { "p_scheduled_at": string,"p_status": Database["public"]['Enums']["publish_status"] }; Returns: boolean
                           },
"is_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"next_credit_note_number":
{ Args: { "p_at"?: string }; Returns: string
                           },
"next_document_number":
{ Args: { "p_at": string,"p_prefix": string,"p_series": string }; Returns: string
                           },
"next_invoice_number":
{ Args: { "p_at"?: string }; Returns: string
                           },
"next_order_number":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"owns_order":
{ Args: { "p_order_id": string }; Returns: boolean
                           },
"products_in_collection":
{ Args: { "p_collection_id": string }; Returns: {
              "blouse_included": boolean,
"blouse_length_m": number | null,
"care": string | null,
"composition": string,
"created_at": string,
"created_by": string | null,
"description": string | null,
"featured_rank": number | null,
"fibre_warp": Database["public"]['Enums']["fibre"] | null,
"fibre_weft": Database["public"]['Enums']["fibre"] | null,
"gi_eligible": boolean,
"gst_rate_bps": number,
"hsn_code": string,
"id": string,
"is_one_of_a_kind": boolean,
"kind": Database["public"]['Enums']["product_kind"],
"lead_time_days": number | null,
"length_m": number | null,
"loom_id": string | null,
"made_to_order": boolean,
"noindex": boolean,
"occasions": (Database["public"]['Enums']["occasion"])[],
"og_image_path": string | null,
"price_max_paise": number | null,
"price_min_paise": number | null,
"primary_fibre": Database["public"]['Enums']["fibre"],
"published_at": string | null,
"rating_avg": number | null,
"rating_count": number,
"returnable": boolean,
"scheduled_at": string | null,
"search_vector": unknown,
"seo_description": string | null,
"seo_title": string | null,
"slug": string,
"status": Database["public"]['Enums']["publish_status"],
"subtitle": string | null,
"swatch_available": boolean,
"swatch_price_paise": number | null,
"tags": (string)[],
"title": string,
"updated_at": string,
"weave": string | null,
"weaver_id": string | null,
"weight_g": number | null,
"width_cm": number | null,
"zari": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "products"
        isOneToOne: false
        isSetofReturn: true
      } },
"publish_scheduled_content":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"purge_stale_data":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"release_expired_reservations":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"release_reservation":
{ Args: { "p_checkout_id": string }; Returns: number
                           },
"reserve_stock":
{ Args: { "p_checkout_id": string,"p_items": Json }; Returns: {
              "checkout_id": string,
"committed_at": string | null,
"created_at": string,
"expires_at": string,
"id": string,
"location_id": string,
"quantity": number,
"released_at": string | null,
"status": Database["public"]['Enums']["reservation_status"],
"variant_id": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "stock_reservations"
        isOneToOne: false
        isSetofReturn: true
      } },
"search_products":
{ Args: { "p_limit"?: number,"p_offset"?: number,"p_query": string }; Returns: {
              "blouse_included": boolean,
"blouse_length_m": number | null,
"care": string | null,
"composition": string,
"created_at": string,
"created_by": string | null,
"description": string | null,
"featured_rank": number | null,
"fibre_warp": Database["public"]['Enums']["fibre"] | null,
"fibre_weft": Database["public"]['Enums']["fibre"] | null,
"gi_eligible": boolean,
"gst_rate_bps": number,
"hsn_code": string,
"id": string,
"is_one_of_a_kind": boolean,
"kind": Database["public"]['Enums']["product_kind"],
"lead_time_days": number | null,
"length_m": number | null,
"loom_id": string | null,
"made_to_order": boolean,
"noindex": boolean,
"occasions": (Database["public"]['Enums']["occasion"])[],
"og_image_path": string | null,
"price_max_paise": number | null,
"price_min_paise": number | null,
"primary_fibre": Database["public"]['Enums']["fibre"],
"published_at": string | null,
"rating_avg": number | null,
"rating_count": number,
"returnable": boolean,
"scheduled_at": string | null,
"search_vector": unknown,
"seo_description": string | null,
"seo_title": string | null,
"slug": string,
"status": Database["public"]['Enums']["publish_status"],
"subtitle": string | null,
"swatch_available": boolean,
"swatch_price_paise": number | null,
"tags": (string)[],
"title": string,
"updated_at": string,
"weave": string | null,
"weaver_id": string | null,
"weight_g": number | null,
"width_cm": number | null,
"zari": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "products"
        isOneToOne: false
        isSetofReturn: true
      } },
"variant_availability":
{ Args: { "p_variant_ids": (string)[] }; Returns: {
              "available": number,"variant_id": string
            }[]
                           }
          }
          Enums: {
            "consent_purpose": "order_processing"|"marketing_email"|"marketing_whatsapp"|"marketing_sms"|"analytics","coupon_type": "percentage"|"flat"|"free_shipping","fibre": "tussar"|"ghicha"|"matka"|"raw_silk"|"mulberry"|"eri"|"noil"|"cotton_silk"|"linen"|"cotton"|"blend","grievance_status": "received"|"acknowledged"|"in_progress"|"resolved","occasion": "office"|"festive"|"wedding"|"puja"|"gifting","order_status": "pending_payment"|"awaiting_cod_confirmation"|"confirmed"|"packed"|"shipped"|"out_for_delivery"|"delivery_failed"|"delivered"|"rto"|"return_requested"|"returned"|"cancelled","payment_method": "upi"|"card"|"netbanking"|"wallet"|"emi"|"cod","payment_status": "pending"|"authorized"|"captured"|"failed"|"refund_pending"|"refunded"|"partially_refunded","product_kind": "saree"|"fabric"|"stole_dupatta"|"dress_material"|"kurta_fabric"|"home_furnishing","publish_status": "draft"|"scheduled"|"published"|"archived","reservation_status": "active"|"committed"|"released"|"expired","return_resolution": "exchange"|"store_credit"|"refund_to_source","return_status": "requested"|"approved"|"rejected"|"pickup_scheduled"|"received"|"qc_passed"|"qc_failed"|"refunded"|"store_credit_issued"|"exchanged","review_status": "pending"|"approved"|"rejected","sell_unit": "piece"|"metre","staff_role": "owner"|"manager"|"catalogue_editor"|"fulfilment"|"support"|"accountant","stock_adjustment_reason": "received"|"sold"|"returned_restock"|"damaged_write_off"|"audit_correction"|"transfer"|"photoshoot","stock_location_type": "shop"|"warehouse"|"with_weaver"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "consent_purpose": ["order_processing", "marketing_email", "marketing_whatsapp", "marketing_sms", "analytics"],"coupon_type": ["percentage", "flat", "free_shipping"],"fibre": ["tussar", "ghicha", "matka", "raw_silk", "mulberry", "eri", "noil", "cotton_silk", "linen", "cotton", "blend"],"grievance_status": ["received", "acknowledged", "in_progress", "resolved"],"occasion": ["office", "festive", "wedding", "puja", "gifting"],"order_status": ["pending_payment", "awaiting_cod_confirmation", "confirmed", "packed", "shipped", "out_for_delivery", "delivery_failed", "delivered", "rto", "return_requested", "returned", "cancelled"],"payment_method": ["upi", "card", "netbanking", "wallet", "emi", "cod"],"payment_status": ["pending", "authorized", "captured", "failed", "refund_pending", "refunded", "partially_refunded"],"product_kind": ["saree", "fabric", "stole_dupatta", "dress_material", "kurta_fabric", "home_furnishing"],"publish_status": ["draft", "scheduled", "published", "archived"],"reservation_status": ["active", "committed", "released", "expired"],"return_resolution": ["exchange", "store_credit", "refund_to_source"],"return_status": ["requested", "approved", "rejected", "pickup_scheduled", "received", "qc_passed", "qc_failed", "refunded", "store_credit_issued", "exchanged"],"review_status": ["pending", "approved", "rejected"],"sell_unit": ["piece", "metre"],"staff_role": ["owner", "manager", "catalogue_editor", "fulfilment", "support", "accountant"],"stock_adjustment_reason": ["received", "sold", "returned_restock", "damaged_write_off", "audit_correction", "transfer", "photoshoot"],"stock_location_type": ["shop", "warehouse", "with_weaver"]
          }
        }
} as const

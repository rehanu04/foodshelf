package com.rehanu.foodshelf.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "grocery_items")
data class GroceryItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val qty: Double? = null,
    val unit: String? = null,
    val category: String? = null,
    val storage: String? = null,
    val tagsCsv: String? = null,
    val updatedAt: Long = System.currentTimeMillis()
)
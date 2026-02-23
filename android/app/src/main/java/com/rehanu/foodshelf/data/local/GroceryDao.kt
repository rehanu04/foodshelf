package com.rehanu.foodshelf.data.local

import androidx.room.*
import com.rehanu.foodshelf.data.model.GroceryItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface GroceryDao {
    @Query("SELECT * FROM grocery_items ORDER BY updatedAt DESC")
    fun observeAll(): Flow<List<GroceryItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(item: GroceryItemEntity): Long

    @Delete
    suspend fun delete(item: GroceryItemEntity)
}
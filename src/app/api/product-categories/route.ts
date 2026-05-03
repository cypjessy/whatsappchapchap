// API Route for managing product categories hierarchy
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Get all categories with their subcategories and brands
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin SDK not configured" },
        { status: 500 }
      );
    }

    const snapshot = await adminDb.collection("productCategories").get();
    const categories = [];

    for (const doc of snapshot.docs) {
      categories.push({
        id: doc.id,
        ...doc.data(),
      });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// Create a new category
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin SDK not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, description, subcategories = [], brands = [] } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const categoryData = {
      name,
      description: description || "",
      subcategories,
      brands,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection("productCategories").add(categoryData);

    return NextResponse.json({
      id: docRef.id,
      ...categoryData,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// Update a category
export async function PATCH(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin SDK not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const categoryRef = adminDb.collection("productCategories").doc(id);
    const doc = await categoryRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    await categoryRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await categoryRef.get();
    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// Delete a category
export async function DELETE(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin SDK not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const categoryRef = adminDb.collection("productCategories").doc(id);
    const doc = await categoryRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    await categoryRef.delete();
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}

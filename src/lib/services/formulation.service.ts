// ============================================================
// FormuLab — Formulation Service
// ============================================================

import { databases, ID, DATABASE_ID, Query } from '../appwrite';
import { COLLECTIONS } from '../constants';
import type {
  ActiveIngredient,
  Formulation,
  RecipeIngredient,
  StabilityTest,
  FormulationStatus,
} from '../types';

// ==================== Active Ingredients ====================

export async function createActiveIngredient(
  data: Omit<ActiveIngredient, '$id' | 'created_at'>
): Promise<ActiveIngredient> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.ACTIVE_INGREDIENTS,
    ID.unique(),
    {
      ...data,
      created_at: new Date().toISOString(),
    }
  );
  return doc as unknown as ActiveIngredient;
}

export async function getActiveIngredient(id: string): Promise<ActiveIngredient> {
  const doc = await databases.getDocument(
    DATABASE_ID,
    COLLECTIONS.ACTIVE_INGREDIENTS,
    id
  );
  return doc as unknown as ActiveIngredient;
}

export async function listActiveIngredients(
  orgId: string,
  search?: string,
  limit = 25,
  offset = 0
): Promise<{ items: ActiveIngredient[]; total: number }> {
  const queries = [
    Query.equal('org_id', orgId),
    Query.orderDesc('created_at'),
    Query.limit(limit),
    Query.offset(offset),
  ];
  if (search) {
    queries.push(Query.search('name', search));
  }
  const response = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.ACTIVE_INGREDIENTS,
    queries
  );
  return {
    items: response.documents as unknown as ActiveIngredient[],
    total: response.total,
  };
}

export async function updateActiveIngredient(
  id: string,
  data: Partial<ActiveIngredient>
): Promise<ActiveIngredient> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.ACTIVE_INGREDIENTS,
    id,
    data
  );
  return doc as unknown as ActiveIngredient;
}

export async function deleteActiveIngredient(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ACTIVE_INGREDIENTS, id);
}

// ==================== Formulations ====================

export async function createFormulation(
  data: Omit<Formulation, '$id' | 'created_at' | 'updated_at' | 'active_ingredient'>
): Promise<Formulation> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.FORMULATIONS,
    ID.unique(),
    {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );
  return doc as unknown as Formulation;
}

export async function getFormulation(id: string): Promise<Formulation> {
  const doc = await databases.getDocument(
    DATABASE_ID,
    COLLECTIONS.FORMULATIONS,
    id
  );
  return doc as unknown as Formulation;
}

export async function listFormulations(
  orgId: string,
  filters?: {
    status?: FormulationStatus;
    type?: string;
    search?: string;
  },
  limit = 25,
  offset = 0
): Promise<{ items: Formulation[]; total: number }> {
  const queries = [
    Query.equal('org_id', orgId),
    Query.orderDesc('updated_at'),
    Query.limit(limit),
    Query.offset(offset),
  ];
  if (filters?.status) {
    queries.push(Query.equal('status', filters.status));
  }
  if (filters?.type) {
    queries.push(Query.equal('formulation_type', filters.type));
  }
  if (filters?.search) {
    queries.push(Query.search('name', filters.search));
  }
  const response = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.FORMULATIONS,
    queries
  );
  return {
    items: response.documents as unknown as Formulation[],
    total: response.total,
  };
}

export async function updateFormulation(
  id: string,
  data: Partial<Formulation>
): Promise<Formulation> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.FORMULATIONS,
    id,
    {
      ...data,
      updated_at: new Date().toISOString(),
    }
  );
  return doc as unknown as Formulation;
}

export async function deleteFormulation(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.FORMULATIONS, id);
}

// ==================== Recipe Ingredients ====================

export async function addRecipeIngredient(
  data: Omit<RecipeIngredient, '$id'>
): Promise<RecipeIngredient> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.RECIPE_INGREDIENTS,
    ID.unique(),
    data
  );
  return doc as unknown as RecipeIngredient;
}

export async function listRecipeIngredients(
  formulationId: string
): Promise<RecipeIngredient[]> {
  const response = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.RECIPE_INGREDIENTS,
    [
      Query.equal('formulation_id', formulationId),
      Query.orderAsc('sort_order'),
    ]
  );
  return response.documents as unknown as RecipeIngredient[];
}

export async function updateRecipeIngredient(
  id: string,
  data: Partial<RecipeIngredient>
): Promise<RecipeIngredient> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.RECIPE_INGREDIENTS,
    id,
    data
  );
  return doc as unknown as RecipeIngredient;
}

export async function deleteRecipeIngredient(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.RECIPE_INGREDIENTS, id);
}

// ==================== Stability Tests ====================

export async function addStabilityTest(
  data: Omit<StabilityTest, '$id'>
): Promise<StabilityTest> {
  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTIONS.STABILITY_TESTS,
    ID.unique(),
    data
  );
  return doc as unknown as StabilityTest;
}

export async function listStabilityTests(
  formulationId: string
): Promise<StabilityTest[]> {
  const response = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.STABILITY_TESTS,
    [
      Query.equal('formulation_id', formulationId),
      Query.orderDesc('tested_at'),
    ]
  );
  return response.documents as unknown as StabilityTest[];
}

export async function updateStabilityTest(
  id: string,
  data: Partial<StabilityTest>
): Promise<StabilityTest> {
  const doc = await databases.updateDocument(
    DATABASE_ID,
    COLLECTIONS.STABILITY_TESTS,
    id,
    data
  );
  return doc as unknown as StabilityTest;
}

export async function deleteStabilityTest(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.STABILITY_TESTS, id);
}

// ==================== Dashboard Stats ====================

export async function getDashboardStats(orgId: string) {
  const [formulations, ingredients] = await Promise.all([
    databases.listDocuments(DATABASE_ID, COLLECTIONS.FORMULATIONS, [
      Query.equal('org_id', orgId),
      Query.limit(1),
    ]),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.ACTIVE_INGREDIENTS, [
      Query.equal('org_id', orgId),
      Query.limit(1),
    ]),
  ]);

  const activeFormulations = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.FORMULATIONS,
    [
      Query.equal('org_id', orgId),
      Query.equal('status', 'draft'),
      Query.limit(1),
    ]
  );

  const approvedFormulations = await databases.listDocuments(
    DATABASE_ID,
    COLLECTIONS.FORMULATIONS,
    [
      Query.equal('org_id', orgId),
      Query.equal('status', 'approved'),
      Query.limit(1),
    ]
  );

  return {
    totalFormulations: formulations.total,
    activeProjects: activeFormulations.total,
    approvedRecipes: approvedFormulations.total,
    totalIngredients: ingredients.total,
  };
}

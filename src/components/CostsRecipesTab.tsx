import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  FaCalculator,
  FaPlus,
  FaTrash,
  FaSave,
  FaEdit,
  FaFlask,
  FaHistory,
  FaBox,
  FaMoneyBillWave,
} from "react-icons/fa";
import Swal from "sweetalert2";

type Ingredient = {
  id: number;
  name: string;
  unit: string;
  unit_price: number;
  notes?: string;
  is_active: boolean;
};

type Product = {
  id: string;
  title: string;
  title_en?: string;
  price: number;
  category?: string;
};

type RecipeIngredient = {
  id?: number;
  ingredient_id: number;
  quantity: number;
};

type RecipeCost = {
  id?: number;
  name: string;
  amount: number;
  notes?: string;
  is_active?: boolean;
};

type Calculation = {
  id: number;
  product_id: string;
  quantity: number;
  ingredient_unit_cost: number;
  additional_unit_cost: number;
  total_unit_cost: number;
  total_cost: number;
  selling_price: number;
  revenue: number;
  profit: number;
  profit_margin: number;
  created_at: string;
  products?: {
    title: string;
  };
};

export default function CostsRecipesTab() {
  const [activeSection, setActiveSection] = useState<
    "ingredients" | "recipes" | "calculator" | "history"
  >("ingredients");

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);

  const [loading, setLoading] = useState(true);

  // =========================
  // Ingredient form
  // =========================

  const [ingredientName, setIngredientName] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("gram");
  const [ingredientPrice, setIngredientPrice] = useState("");
  const [editingIngredientId, setEditingIngredientId] = useState<number | null>(
    null,
  );

  // =========================
  // Recipe
  // =========================

  const [selectedProductId, setSelectedProductId] = useState("");
  const [recipeName, setRecipeName] = useState("الوصفة الأساسية");
  const [recipeId, setRecipeId] = useState<number | null>(null);

  const [recipeIngredients, setRecipeIngredients] = useState<
    RecipeIngredient[]
  >([]);
  const [recipeCosts, setRecipeCosts] = useState<RecipeCost[]>([]);

  // =========================
  // Calculator
  // =========================

  const [calculatorProductId, setCalculatorProductId] = useState("");
  const [soldQuantity, setSoldQuantity] = useState("");

  // =========================
  // Initial loading
  // =========================

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);

    await Promise.all([
      fetchIngredients(),
      fetchProducts(),
      fetchCalculations(),
    ]);

    setLoading(false);
  };

  const fetchIngredients = async () => {
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setIngredients(data);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,title,title_en,price,category")
      .eq("is_hidden", false)
      .order("title");

    if (!error && data) {
      setProducts(data);
    }
  };

  const fetchCalculations = async () => {
    const { data, error } = await supabase
      .from("cost_calculations")
      .select(
        `
        *,
        products (
          title
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setCalculations(data as Calculation[]);
    }
  };

  // =====================================================
  // INGREDIENTS
  // =====================================================

  const resetIngredientForm = () => {
    setIngredientName("");
    setIngredientUnit("gram");
    setIngredientPrice("");
    setEditingIngredientId(null);
  };

  const saveIngredient = async () => {
    if (!ingredientName.trim() || !ingredientPrice) {
      Swal.fire("تنبيه", "أدخل اسم المكوّن وسعر الوحدة.", "warning");
      return;
    }

    const price = Number(ingredientPrice);

    if (price < 0) {
      Swal.fire("تنبيه", "السعر لا يمكن أن يكون سالبًا.", "warning");
      return;
    }

    if (editingIngredientId) {
      const { error } = await supabase
        .from("ingredients")
        .update({
          name: ingredientName.trim(),
          unit: ingredientUnit,
          unit_price: price,
        })
        .eq("id", editingIngredientId);

      if (error) {
        Swal.fire("خطأ", error.message, "error");
        return;
      }

      Swal.fire("تم", "تم تعديل المكوّن بنجاح.", "success");
    } else {
      const { error } = await supabase.from("ingredients").insert({
        name: ingredientName.trim(),
        unit: ingredientUnit,
        unit_price: price,
      });

      if (error) {
        Swal.fire("خطأ", error.message, "error");
        return;
      }

      Swal.fire("تم", "تمت إضافة المكوّن بنجاح.", "success");
    }

    resetIngredientForm();
    fetchIngredients();
  };

  const editIngredient = (ingredient: Ingredient) => {
    setEditingIngredientId(ingredient.id);
    setIngredientName(ingredient.name);
    setIngredientUnit(ingredient.unit);
    setIngredientPrice(String(ingredient.unit_price));

    setActiveSection("ingredients");
  };

  const deleteIngredient = async (ingredient: Ingredient) => {
    const result = await Swal.fire({
      title: "حذف المكوّن؟",
      text: `سيتم حذف "${ingredient.name}" إذا لم يكن مستخدمًا في وصفة.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#c62828",
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase
      .from("ingredients")
      .delete()
      .eq("id", ingredient.id);

    if (error) {
      Swal.fire(
        "لا يمكن الحذف",
        "هذا المكوّن قد يكون مستخدمًا في إحدى الوصفات. يمكنك تعديل سعره بدل حذفه.",
        "error",
      );
      return;
    }

    fetchIngredients();

    Swal.fire("تم", "تم حذف المكوّن.", "success");
  };

  // =====================================================
  // RECIPE
  // =====================================================

  const loadRecipe = async (productId: string) => {
    setSelectedProductId(productId);
    setRecipeId(null);
    setRecipeName("الوصفة الأساسية");
    setRecipeIngredients([]);
    setRecipeCosts([]);

    if (!productId) return;

    const { data: recipe, error } = await supabase
      .from("product_recipes")
      .select("*")
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      Swal.fire("خطأ", error.message, "error");
      return;
    }

    if (!recipe) {
      return;
    }

    setRecipeId(recipe.id);
    setRecipeName(recipe.recipe_name || "الوصفة الأساسية");

    const { data: recipeItems } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", recipe.id);

    const { data: costs } = await supabase
      .from("recipe_costs")
      .select("*")
      .eq("recipe_id", recipe.id)
      .eq("is_active", true);

    setRecipeIngredients(
      (recipeItems || []).map((item) => ({
        id: item.id,
        ingredient_id: item.ingredient_id,
        quantity: Number(item.quantity),
      })),
    );

    setRecipeCosts(
      (costs || []).map((cost) => ({
        id: cost.id,
        name: cost.name,
        amount: Number(cost.amount),
        notes: cost.notes || "",
        is_active: cost.is_active,
      })),
    );
  };

  const addRecipeIngredient = () => {
    if (ingredients.length === 0) {
      Swal.fire("تنبيه", "أضف المكونات أولًا من قسم المكونات.", "warning");
      return;
    }

    setRecipeIngredients((prev) => [
      ...prev,
      {
        ingredient_id: ingredients[0].id,
        quantity: 0,
      },
    ]);
  };

  const updateRecipeIngredient = (
    index: number,
    field: "ingredient_id" | "quantity",
    value: number,
  ) => {
    setRecipeIngredients((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const removeRecipeIngredient = (index: number) => {
    setRecipeIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const addRecipeCost = () => {
    setRecipeCosts((prev) => [
      ...prev,
      {
        name: "",
        amount: 0,
        notes: "",
        is_active: true,
      },
    ]);
  };

  const updateRecipeCost = (
    index: number,
    field: keyof RecipeCost,
    value: string | number,
  ) => {
    setRecipeCosts((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const removeRecipeCost = (index: number) => {
    setRecipeCosts((prev) => prev.filter((_, i) => i !== index));
  };

  const saveRecipe = async () => {
    if (!selectedProductId) {
      Swal.fire("تنبيه", "اختر المنتج أولًا.", "warning");
      return;
    }

    if (recipeIngredients.length === 0) {
      Swal.fire("تنبيه", "أضف مكونات الوصفة أولًا.", "warning");
      return;
    }

    const invalidIngredient = recipeIngredients.some(
      (item) => !item.ingredient_id || Number(item.quantity) <= 0,
    );

    if (invalidIngredient) {
      Swal.fire(
        "تنبيه",
        "تأكد من اختيار كل مكوّن وإدخال كمية أكبر من صفر.",
        "warning",
      );
      return;
    }

    const invalidCost = recipeCosts.some(
      (cost) => !cost.name.trim() || Number(cost.amount) < 0,
    );

    if (invalidCost) {
      Swal.fire("تنبيه", "تأكد من إدخال اسم وتكلفة كل مصروف.", "warning");
      return;
    }

    try {
      let currentRecipeId = recipeId;

      // إنشاء الوصفة إذا لم تكن موجودة
      if (!currentRecipeId) {
        const { data, error } = await supabase
          .from("product_recipes")
          .insert({
            product_id: selectedProductId,
            recipe_name: recipeName || "الوصفة الأساسية",
          })
          .select()
          .single();

        if (error) throw error;

        currentRecipeId = data.id;
        setRecipeId(data.id);
      } else {
        const { error } = await supabase
          .from("product_recipes")
          .update({
            recipe_name: recipeName || "الوصفة الأساسية",
          })
          .eq("id", currentRecipeId);

        if (error) throw error;
      }

      // حذف المكونات القديمة ثم حفظ الحالية
      const { error: deleteIngredientsError } = await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("recipe_id", currentRecipeId);

      if (deleteIngredientsError) {
        throw deleteIngredientsError;
      }

      const ingredientRows = recipeIngredients.map((item) => ({
        recipe_id: currentRecipeId,
        ingredient_id: item.ingredient_id,
        quantity: Number(item.quantity),
      }));

      const { error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .insert(ingredientRows);

      if (ingredientsError) {
        throw ingredientsError;
      }

      // حذف المصاريف القديمة
      const { error: deleteCostsError } = await supabase
        .from("recipe_costs")
        .delete()
        .eq("recipe_id", currentRecipeId);

      if (deleteCostsError) {
        throw deleteCostsError;
      }

      if (recipeCosts.length > 0) {
        const costRows = recipeCosts.map((cost) => ({
          recipe_id: currentRecipeId,
          name: cost.name.trim(),
          amount: Number(cost.amount),
          notes: cost.notes || "",
          is_active: true,
        }));

        const { error: costsError } = await supabase
          .from("recipe_costs")
          .insert(costRows);

        if (costsError) {
          throw costsError;
        }
      }

      Swal.fire("تم الحفظ", "تم حفظ وصفة المنتج وتكاليفه بنجاح.", "success");

      await loadRecipe(selectedProductId);
    } catch (error: any) {
      Swal.fire("خطأ", error.message, "error");
    }
  };

  // =====================================================
  // CALCULATOR
  // =====================================================

  const calculatorProduct = products.find(
    (product) => product.id === calculatorProductId,
  );

  const calculatorData = useMemo(() => {
    return {
      ingredientUnitCost: 0,
      additionalUnitCost: 0,
      totalUnitCost: 0,
      totalCost: 0,
      revenue: 0,
      profit: 0,
      margin: 0,
    };
  }, []);

  const [calculatedData, setCalculatedData] = useState(calculatorData);

  const calculateProfit = async () => {
    if (!calculatorProductId) {
      Swal.fire("تنبيه", "اختر المنتج.", "warning");
      return;
    }

    const quantity = Number(soldQuantity);

    if (!quantity || quantity <= 0) {
      Swal.fire("تنبيه", "أدخل عدد القطع المباعة.", "warning");
      return;
    }

    const { data: recipe, error: recipeError } = await supabase
      .from("product_recipes")
      .select("*")
      .eq("product_id", calculatorProductId)
      .maybeSingle();

    if (recipeError) {
      Swal.fire("خطأ", recipeError.message, "error");
      return;
    }

    if (!recipe) {
      Swal.fire(
        "لا توجد وصفة",
        "هذا المنتج لا توجد له وصفة محفوظة حتى الآن.",
        "warning",
      );
      return;
    }

    const { data: recipeItems, error: itemsError } = await supabase
      .from("recipe_ingredients")
      .select(
        `
        quantity,
        ingredients (
          unit_price
        )
      `,
      )
      .eq("recipe_id", recipe.id);

    if (itemsError) {
      Swal.fire("خطأ", itemsError.message, "error");
      return;
    }

    const { data: costs, error: costsError } = await supabase
      .from("recipe_costs")
      .select("amount")
      .eq("recipe_id", recipe.id)
      .eq("is_active", true);

    if (costsError) {
      Swal.fire("خطأ", costsError.message, "error");
      return;
    }

    let ingredientUnitCost = 0;

    (recipeItems || []).forEach((item: any) => {
      const unitPrice = Number(item.ingredients?.unit_price || 0);

      ingredientUnitCost += Number(item.quantity) * unitPrice;
    });

    const additionalUnitCost = (costs || []).reduce(
      (sum, cost) => sum + Number(cost.amount || 0),
      0,
    );

    const totalUnitCost = ingredientUnitCost + additionalUnitCost;

    const totalCost = totalUnitCost * quantity;

    const sellingPrice = Number(calculatorProduct?.price || 0);

    const revenue = sellingPrice * quantity;

    const profit = revenue - totalCost;

    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    setCalculatedData({
      ingredientUnitCost,
      additionalUnitCost,
      totalUnitCost,
      totalCost,
      revenue,
      profit,
      margin,
    });
  };

  const saveCalculation = async () => {
    if (!calculatorProductId) return;

    const quantity = Number(soldQuantity);

    if (!quantity || calculatedData.totalUnitCost <= 0) {
      Swal.fire("تنبيه", "قم بالحساب أولًا ثم احفظ العملية.", "warning");
      return;
    }

    const { data: recipe } = await supabase
      .from("product_recipes")
      .select("id")
      .eq("product_id", calculatorProductId)
      .maybeSingle();

    const { error } = await supabase.from("cost_calculations").insert({
      product_id: calculatorProductId,
      recipe_id: recipe?.id || null,
      quantity,
      ingredient_unit_cost: calculatedData.ingredientUnitCost,
      additional_unit_cost: calculatedData.additionalUnitCost,
      total_unit_cost: calculatedData.totalUnitCost,
      total_cost: calculatedData.totalCost,
      selling_price: Number(calculatorProduct?.price || 0),
      revenue: calculatedData.revenue,
      profit: calculatedData.profit,
      profit_margin: calculatedData.margin,
    });

    if (error) {
      Swal.fire("خطأ", error.message, "error");
      return;
    }

    Swal.fire("تم الحفظ", "تم حفظ عملية البيع في سجل الأرباح.", "success");

    fetchCalculations();
  };

  const formatMoney = (value: number) =>
    Number(value || 0).toLocaleString("ar-IQ", {
      maximumFractionDigits: 2,
    });

  if (loading) {
    return (
      <div
        style={{
          padding: "60px",
          textAlign: "center",
          color: "var(--gold)",
          fontWeight: "bold",
        }}
      >
        جاري تحميل نظام التكاليف...
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div dir="rtl">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "25px",
        }}
      >
        <div>
          <h2
            style={{
              color: "var(--dark-brown)",
              margin: 0,
              fontSize: "2rem",
            }}
          >
            التكاليف والوصفات 🧮
          </h2>

          <p style={{ color: "#777", marginTop: "8px" }}>
            إدارة وصفات المنتجات وحساب التكلفة والأرباح.
          </p>
        </div>
      </div>

      {/* =========================
          Navigation
      ========================= */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "25px",
        }}
      >
        <SectionButton
          active={activeSection === "ingredients"}
          onClick={() => setActiveSection("ingredients")}
          icon={<FaFlask />}
          text="المكونات"
        />

        <SectionButton
          active={activeSection === "recipes"}
          onClick={() => setActiveSection("recipes")}
          icon={<FaBox />}
          text="الوصفات"
        />

        <SectionButton
          active={activeSection === "calculator"}
          onClick={() => setActiveSection("calculator")}
          icon={<FaCalculator />}
          text="حاسبة الأرباح"
        />

        <SectionButton
          active={activeSection === "history"}
          onClick={() => setActiveSection("history")}
          icon={<FaHistory />}
          text="سجل الأرباح"
        />
      </div>

      {/* =====================================================
          INGREDIENTS
      ===================================================== */}

      {activeSection === "ingredients" && (
        <div>
          <div className="cost-card">
            <h3>🧂 إضافة مكوّن</h3>

            <div className="cost-grid">
              <InputField
                label="اسم المكوّن"
                value={ingredientName}
                onChange={setIngredientName}
                placeholder="مثلاً: طحين"
              />

              <div>
                <label>الوحدة</label>

                <select
                  value={ingredientUnit}
                  onChange={(e) => setIngredientUnit(e.target.value)}
                >
                  <option value="gram">غرام</option>
                  <option value="kg">كيلوغرام</option>
                  <option value="ml">مل</option>
                  <option value="liter">لتر</option>
                  <option value="piece">حبة</option>
                </select>
              </div>

              <InputField
                label="سعر الوحدة (د.ع)"
                type="number"
                value={ingredientPrice}
                onChange={setIngredientPrice}
                placeholder="مثلاً: 2"
              />
            </div>

            <div style={{ marginTop: "20px" }}>
              <button className="btn-primary" onClick={saveIngredient}>
                {editingIngredientId ? (
                  <>
                    <FaEdit /> حفظ التعديل
                  </>
                ) : (
                  <>
                    <FaPlus /> إضافة المكوّن
                  </>
                )}
              </button>

              {editingIngredientId && (
                <button onClick={resetIngredientForm} style={secondaryButton}>
                  إلغاء التعديل
                </button>
              )}
            </div>
          </div>

          <div className="cost-card">
            <h3>قائمة المكونات</h3>

            {ingredients.length === 0 ? (
              <Empty text="لا توجد مكونات حتى الآن." />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="cost-table">
                  <thead>
                    <tr>
                      <th>المكوّن</th>
                      <th>الوحدة</th>
                      <th>سعر الوحدة</th>
                      <th>إجراء</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ingredients.map((ingredient) => (
                      <tr key={ingredient.id}>
                        <td>{ingredient.name}</td>

                        <td>{unitLabel(ingredient.unit)}</td>

                        <td>{formatMoney(ingredient.unit_price)} د.ع</td>

                        <td>
                          <button
                            onClick={() => editIngredient(ingredient)}
                            style={editButton}
                          >
                            <FaEdit />
                          </button>

                          <button
                            onClick={() => deleteIngredient(ingredient)}
                            style={deleteButton}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          RECIPES
      ===================================================== */}

      {activeSection === "recipes" && (
        <div>
          <div className="cost-card">
            <h3>🍪 اختيار المنتج</h3>

            <select
              value={selectedProductId}
              onChange={(e) => loadRecipe(e.target.value)}
            >
              <option value="">اختر المنتج...</option>

              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>

            {selectedProductId && (
              <div style={{ marginTop: "20px" }}>
                <InputField
                  label="اسم الوصفة"
                  value={recipeName}
                  onChange={setRecipeName}
                  placeholder="الوصفة الأساسية"
                />
              </div>
            )}
          </div>

          {selectedProductId && (
            <>
              <div className="cost-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <h3>🧈 مكونات القطعة الواحدة</h3>

                  <button className="btn-primary" onClick={addRecipeIngredient}>
                    <FaPlus /> إضافة مكوّن
                  </button>
                </div>

                {recipeIngredients.length === 0 ? (
                  <Empty text="لم تتم إضافة مكونات للوصفة." />
                ) : (
                  recipeIngredients.map((item, index) => {
                    const selectedIngredient = ingredients.find(
                      (i) => i.id === item.ingredient_id,
                    );

                    const lineCost =
                      Number(item.quantity || 0) *
                      Number(selectedIngredient?.unit_price || 0);

                    return (
                      <div
                        key={index}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr auto",
                          gap: "10px",
                          alignItems: "end",
                          marginBottom: "12px",
                          padding: "12px",
                          background: "#fafafa",
                          borderRadius: "10px",
                        }}
                      >
                        <div>
                          <label>المكوّن</label>

                          <select
                            value={item.ingredient_id}
                            onChange={(e) =>
                              updateRecipeIngredient(
                                index,
                                "ingredient_id",
                                Number(e.target.value),
                              )
                            }
                          >
                            {ingredients.map((ingredient) => (
                              <option key={ingredient.id} value={ingredient.id}>
                                {ingredient.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label>الكمية</label>

                          <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={item.quantity}
                            onChange={(e) =>
                              updateRecipeIngredient(
                                index,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>

                        <div>
                          <label>تكلفة المكوّن</label>

                          <div
                            style={{
                              padding: "12px",
                              background: "#f0f0f0",
                              borderRadius: "8px",
                              fontWeight: "bold",
                            }}
                          >
                            {formatMoney(lineCost)} د.ع
                          </div>
                        </div>

                        <button
                          onClick={() => removeRecipeIngredient(index)}
                          style={deleteButton}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="cost-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <div>
                    <h3>🔥 المصاريف الإضافية</h3>

                    <p
                      style={{
                        color: "#777",
                        margin: "5px 0",
                      }}
                    >
                      كل مبلغ هنا محسوب للقطعة الواحدة.
                    </p>
                  </div>

                  <button className="btn-primary" onClick={addRecipeCost}>
                    <FaPlus /> إضافة مصروف
                  </button>
                </div>

                {recipeCosts.map((cost, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 2fr auto",
                      gap: "10px",
                      alignItems: "end",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <label>اسم المصروف</label>

                      <input
                        type="text"
                        placeholder="مثلاً: غاز"
                        value={cost.name}
                        onChange={(e) =>
                          updateRecipeCost(index, "name", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label>التكلفة للقطعة</label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={cost.amount}
                        onChange={(e) =>
                          updateRecipeCost(
                            index,
                            "amount",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>

                    <div>
                      <label>ملاحظات</label>

                      <input
                        type="text"
                        value={cost.notes || ""}
                        onChange={(e) =>
                          updateRecipeCost(index, "notes", e.target.value)
                        }
                      />
                    </div>

                    <button
                      onClick={() => removeRecipeCost(index)}
                      style={deleteButton}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>

              <button
                className="btn-primary"
                onClick={saveRecipe}
                style={{
                  padding: "14px 30px",
                  fontSize: "1rem",
                }}
              >
                <FaSave /> حفظ الوصفة والتكاليف
              </button>
            </>
          )}
        </div>
      )}

      {/* =====================================================
          CALCULATOR
      ===================================================== */}

      {activeSection === "calculator" && (
        <div>
          <div className="cost-card">
            <h3>
              <FaCalculator /> حاسبة الأرباح
            </h3>

            <p style={{ color: "#777" }}>
              اختر المنتج واكتب عدد القطع التي تم بيعها.
            </p>

            <div className="cost-grid">
              <div>
                <label>المنتج</label>

                <select
                  value={calculatorProductId}
                  onChange={(e) => {
                    setCalculatorProductId(e.target.value);

                    setCalculatedData({
                      ingredientUnitCost: 0,
                      additionalUnitCost: 0,
                      totalUnitCost: 0,
                      totalCost: 0,
                      revenue: 0,
                      profit: 0,
                      margin: 0,
                    });
                  }}
                >
                  <option value="">اختر المنتج...</option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </div>

              <InputField
                label="عدد القطع المباعة"
                type="number"
                value={soldQuantity}
                onChange={setSoldQuantity}
                placeholder="مثلاً: 50"
              />
            </div>

            {calculatorProduct && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  background: "#fff8e1",
                  borderRadius: "10px",
                }}
              >
                سعر بيع القطعة الحالي:
                <strong style={{ marginRight: "8px" }}>
                  {formatMoney(calculatorProduct.price)} د.ع
                </strong>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={calculateProfit}
              style={{ marginTop: "20px" }}
            >
              <FaCalculator /> احسب الأرباح
            </button>
          </div>

          {calculatedData.totalUnitCost > 0 && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                <ResultCard
                  title="تكلفة المكونات / قطعة"
                  value={calculatedData.ingredientUnitCost}
                />

                <ResultCard
                  title="المصاريف / قطعة"
                  value={calculatedData.additionalUnitCost}
                />

                <ResultCard
                  title="تكلفة القطعة"
                  value={calculatedData.totalUnitCost}
                  highlight
                />

                <ResultCard
                  title="إجمالي التكلفة"
                  value={calculatedData.totalCost}
                />

                <ResultCard
                  title="إجمالي المبيعات"
                  value={calculatedData.revenue}
                />

                <ResultCard
                  title="صافي الربح"
                  value={calculatedData.profit}
                  profit
                />
              </div>

              <div className="cost-card" style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1rem",
                    color: "#777",
                  }}
                >
                  هامش الربح
                </div>

                <div
                  style={{
                    fontSize: "3rem",
                    fontWeight: "bold",
                    color: calculatedData.margin >= 0 ? "#2e7d32" : "#c62828",
                    margin: "10px 0",
                  }}
                >
                  {calculatedData.margin.toFixed(2)}%
                </div>

                <button className="btn-primary" onClick={saveCalculation}>
                  <FaSave /> حفظ العملية في سجل الأرباح
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* =====================================================
          HISTORY
      ===================================================== */}

      {activeSection === "history" && (
        <div className="cost-card">
          <h3>
            <FaHistory /> سجل الأرباح
          </h3>

          {calculations.length === 0 ? (
            <Empty text="لا توجد عمليات محفوظة حتى الآن." />
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="cost-table">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>التكلفة</th>
                    <th>المبيعات</th>
                    <th>الربح</th>
                    <th>الهامش</th>
                    <th>التاريخ</th>
                  </tr>
                </thead>

                <tbody>
                  {calculations.map((calc) => (
                    <tr key={calc.id}>
                      <td>
                        {calc.products?.title ||
                          products.find((p) => p.id === calc.product_id)
                            ?.title ||
                          "منتج"}
                      </td>

                      <td>{formatMoney(calc.quantity)}</td>

                      <td>{formatMoney(calc.total_cost)} د.ع</td>

                      <td>{formatMoney(calc.revenue)} د.ع</td>

                      <td
                        style={{
                          color: calc.profit >= 0 ? "#2e7d32" : "#c62828",
                          fontWeight: "bold",
                        }}
                      >
                        {formatMoney(calc.profit)} د.ع
                      </td>

                      <td>{Number(calc.profit_margin).toFixed(2)}%</td>

                      <td>
                        {new Date(calc.created_at).toLocaleString("ar-IQ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          Styles
      ===================================================== */}

      <style>{`

        .cost-card {
          background: #fff;
          padding: 25px;
          border-radius: 15px;
          margin-bottom: 20px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .cost-card h3 {
          color: var(--dark-brown);
          margin-top: 0;
          margin-bottom: 20px;
        }

        .cost-grid {
          display: grid;
          grid-template-columns:
            repeat(auto-fit,minmax(200px,1fr));
          gap: 15px;
        }

        .cost-card label {
          display: block;
          margin-bottom: 7px;
          font-weight: bold;
          color: #555;
        }

        .cost-card input,
        .cost-card select {
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background: #fff;
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
        }

        .cost-card input:focus,
        .cost-card select:focus {
          border-color: var(--gold);
        }

        .cost-table {
          width: 100%;
          border-collapse: collapse;
        }

        .cost-table th,
        .cost-table td {
          padding: 13px;
          border-bottom: 1px solid #eee;
          text-align: right;
          white-space: nowrap;
        }

        .cost-table th {
          background: #faf6f0;
          color: var(--dark-brown);
        }

        @media (max-width: 700px) {

          .cost-card {
            padding: 15px;
          }

          .cost-table th,
          .cost-table td {
            padding: 10px;
            font-size: 0.85rem;
          }

        }

      `}</style>
    </div>
  );
}

// =====================================================
// COMPONENTS
// =====================================================

function SectionButton({
  active,
  onClick,
  icon,
  text,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 18px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold",
        background: active ? "var(--gold)" : "#fff",
        color: active ? "#fff" : "var(--dark-brown)",
        boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
      }}
    >
      {icon}
      {text}
    </button>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label>{label}</label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ResultCard({
  title,
  value,
  highlight = false,
  profit = false,
}: {
  title: string;
  value: number;
  highlight?: boolean;
  profit?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        borderTop: `4px solid ${
          profit ? "#2e7d32" : highlight ? "var(--gold)" : "#ddd"
        }`,
      }}
    >
      <div
        style={{
          color: "#777",
          fontSize: "0.85rem",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontWeight: "bold",
          fontSize: "1.3rem",
          color: profit ? "#2e7d32" : "var(--dark-brown)",
        }}
      >
        {Number(value || 0).toLocaleString("ar-IQ", {
          maximumFractionDigits: 2,
        })}{" "}
        د.ع
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "35px",
        color: "#888",
        background: "#fafafa",
        borderRadius: "10px",
      }}
    >
      {text}
    </div>
  );
}

function unitLabel(unit: string) {
  switch (unit) {
    case "gram":
      return "غرام";
    case "kg":
      return "كيلوغرام";
    case "ml":
      return "مل";
    case "liter":
      return "لتر";
    case "piece":
      return "حبة";
    default:
      return unit;
  }
}

const secondaryButton: React.CSSProperties = {
  marginRight: "10px",
  padding: "12px 20px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
};

const editButton: React.CSSProperties = {
  background: "#e3f2fd",
  color: "#1565c0",
  border: "none",
  padding: "9px 11px",
  borderRadius: "7px",
  cursor: "pointer",
  marginLeft: "5px",
};

const deleteButton: React.CSSProperties = {
  background: "#ffebee",
  color: "#c62828",
  border: "none",
  padding: "9px 11px",
  borderRadius: "7px",
  cursor: "pointer",
};

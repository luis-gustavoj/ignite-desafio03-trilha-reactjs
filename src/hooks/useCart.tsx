import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`);
      let stockItem: Stock = { ...response.data };
      const response2 = await api.get(`/products/${productId}`);
      let product: Product = { ...response2.data };

      if (response.status === 200) {
        if (response2.status === 200) {
          const cartItem = cart.find((product) => product.id === productId);
          let totalAmount = 0;
          if (stockItem) {
            if (product) {
              if (cartItem) {
                const filteredCart = cart.filter(
                  (cartProduct) => cartProduct.id !== productId
                );
                totalAmount = cartItem.amount + 1;
                if (totalAmount > stockItem.amount || totalAmount < 1) {
                  toast.error("Quantidade solicitada fora de estoque");
                } else {
                  setCart([
                    ...filteredCart,
                    { ...cartItem, amount: totalAmount },
                  ]);
                  localStorage.setItem(
                    "@RocketShoes:cart",
                    JSON.stringify([
                      ...filteredCart,
                      { ...cartItem, amount: totalAmount },
                    ])
                  );
                }
              } else {
                totalAmount = 1;
                if (product) {
                  if (totalAmount > stockItem.amount || totalAmount < 1) {
                    toast.error("Quantidade solicitada fora de estoque");
                  } else {
                    setCart([...cart, { ...product, amount: totalAmount }]);
                    localStorage.setItem(
                      "@RocketShoes:cart",
                      JSON.stringify([
                        ...cart,
                        { ...product, amount: totalAmount },
                      ])
                    );
                  }
                }
              }
            } else {
              throw new Error();
            }
          }
        }
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (cart.find((cartItem) => cartItem.id === productId)) {
        if (productId) {
          const newCart = cart.filter((product) => product.id !== productId);
          setCart(newCart);
          localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
        } else {
          throw new Error();
        }
      } else {
        throw new Error();
      }
    } catch (e: any) {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get(`stock/${productId}`);
      let stockItem: Stock = { ...response.data };
      if (response.status === 200) {
        const cartItem = cart.find((product) => product.id === productId);
        if (cartItem) {
          if (stockItem) {
            if (amount > stockItem.amount || amount < 1) {
              toast.error("Quantidade solicitada fora de estoque");
            } else {
              const cartItemIndex = cart.findIndex(
                (cartItem) => cartItem.id === productId
              );
              let newCart = [...cart];
              newCart[cartItemIndex].amount = amount;
              setCart(newCart);
              localStorage.setItem(
                "@RocketShoes:cart",
                JSON.stringify(newCart)
              );
            }
          }
        }
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

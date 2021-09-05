import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
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

  useEffect(() => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
  }, [cart]);

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get("stock");
      let stock: Stock[] = response.data;
      if (stock) {
        const itemExists = stock.find(
          (stockItem) => stockItem.id === productId
        );
        if (!itemExists) {
          throw new Error();
        } else {
          let cartItem = cart.find((product) => product.id === productId);
          const stockItem = stock.find(
            (product) => productId === product.id && { ...product }
          );
          if (cartItem) {
            let totalAmount = cartItem.amount + 1;
            const filteredCart = cart.filter(
              (product) => product.id !== productId
            );
            if (stockItem) {
              if (totalAmount > stockItem.amount || totalAmount < 1) {
                totalAmount = cartItem.amount;
                toast.error("Quantidade solicitada fora de estoque");
              } else {
                setCart([
                  ...filteredCart,
                  { ...cartItem, amount: totalAmount },
                ]);
              }
            }
          } else {
            const { data } = await api.get(`products/${productId}`);
            let totalAmount = 1;
            if (stockItem) {
              if (totalAmount > stockItem.amount || totalAmount < 1) {
                toast.error("Quantidade solicitada fora de estoque");
              } else {
                setCart([...cart, { ...data, amount: totalAmount }]);
              }
            }
          }
        }
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (productId) {
        setCart(cart.filter((product) => product.id !== productId));
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
      const response = await api.get("stock");
      let stock: Stock[] = response.data;
      if (stock) {
        if (amount <= 0) {
          throw new Error();
        } else {
          if (stock) {
            const stockItem = stock.find(
              (product) => productId === product.id && { ...product }
            );
            if (stockItem) {
              if (amount > stockItem.amount || amount < 1) {
                toast.error("Quantidade solicitada fora de estoque");
              } else {
                const newCart = cart.map((product) => {
                  if (product.id === productId) {
                    if (amount > stockItem.amount || amount < 1) {
                    } else {
                      return {
                        ...product,
                        amount: amount,
                      };
                    }
                  }
                  return { ...product };
                });
                setCart(newCart);
              }
            }
          }
        }
      } else {
        throw new Error();
      }
    } catch (e: any) {
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

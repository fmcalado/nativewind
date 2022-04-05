import { Text } from "react-native";
import { TailwindProvider } from "../../../src";

export function Test() {
  return (
    <TailwindProvider>
      <Text className="">Hello world!</Text>
    </TailwindProvider>
  );
}
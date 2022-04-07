import { NodePath } from "@babel/core";
import { Expression, JSXOpeningElement } from "@babel/types";
import { NativeVisitorState } from "../native-visitor";
import { Babel } from "../types";

import {
  createMergedStylesExpressionContainer,
  getStyleAttributesAndValues,
} from "./jsx";

export interface TransformClassNameOptions {
  inlineStyles: boolean;
}

export function transformClassName(
  babel: Babel,
  path: NodePath<JSXOpeningElement>,
  state: NativeVisitorState
): boolean {
  const {
    className: existingClassName,
    classNameAttribute: existingClassNameAttribute,
    styleAttribute: existingStyleAttribute,
    style: existingStyle,
  } = getStyleAttributesAndValues(babel, path);

  /**
   * If we didn't find any classNames, return early
   */
  if (!existingClassName) {
    return false;
  }

  /**
   * Remove the existing attributes, we are going to add a new ones
   */
  existingClassNameAttribute?.remove();
  existingStyleAttribute?.remove();

  /**
   * If there are existing styles we need to merge them
   *
   * Classnames have lower specificity than inline styles
   * so they should always be first
   */
  const { types: t } = babel;
  const {
    transformClassNameOptions: { inlineStyles },
  } = state;

  const callExpressionArguments: Array<Expression> = inlineStyles
    ? [
        existingClassName,
        t.objectExpression([
          t.objectProperty(
            t.identifier("styles"),
            t.identifier("__tailwindStyles")
          ),
          t.objectProperty(
            t.identifier("media"),
            t.identifier("__tailwindMedia")
          ),
        ]),
      ]
    : [existingClassName];

  const hookCallExpression = t.callExpression(
    t.identifier("__useParseTailwind"),
    callExpressionArguments
  );

  const hookExpression = inlineStyles
    ? t.assignmentExpression(
        "=",
        t.identifier(`__trn${state.hookCount++}`),
        hookCallExpression
      )
    : hookCallExpression;

  const newStyleExpression = createMergedStylesExpressionContainer(
    babel,
    hookExpression,
    existingStyle
  );

  path.node.attributes.push(
    t.jSXAttribute(t.jSXIdentifier("style"), newStyleExpression)
  );

  return true;
}
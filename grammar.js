const PREC = {
  COMMA: -1,
  ASSIGN: 0,
  OBJECT: 1,
  TERNARY: 1,
  OR: 2,
  AND: 3,
  PLUS: 4,
  REL: 5,
  TIMES: 6,
  TYPEOF: 7,
  DELETE: 7,
  VOID: 7,
  NOT: 8,
  NEG: 9,
  INC: 10,
  NEW: 11,
  CALL: 12,
  MEMBER: 13
};

module.exports = grammar({
  name: 'javascript',

  extras: $ => [
    $.comment,
    $._line_break,
    /[ \t\r]/
  ],

  conflicts: $ => [
    [$._expression, $.method_definition],
    [$._expression, $.formal_parameters]
  ],

  rules: {
    program: $ => optional($._statements),

    _statements: $ => choice(
      seq($._statement, optional($._statements)),
      choice(
        $.trailing_break_statement,
        $.trailing_yield_statement,
        $.trailing_throw_statement,
        $.trailing_return_statement,
        $.trailing_expression_statement
      )
    ),

    //
    // Export declarations
    //

    export_statement: $ => choice(
      seq('export', '*', $._from_clause, terminator()),
      seq('export', $.export_clause, $._from_clause, terminator()),
      seq('export', $.export_clause, terminator()),
      seq('export', $._declaration),
      seq('export', 'default', $.anonymous_class),
      seq('export', 'default', $._expression, terminator())
    ),

    export_clause: $ => seq(
      '{', commaSep($.export_specifier), '}'
    ),

    export_specifier: $ => choice(
      $.identifier,
      seq($.identifier, "as", $.identifier)
    ),

    // A function, generator, class, or variable declaration
    _declaration: $ => choice(
      $.function,
      $.generator_function,
      $.anonymous_class,
      $.class,
      $.var_declaration
    ),

    //
    // Import declarations
    //

    import_statement: $ => seq(
      'import',
      choice(
        seq($.import_clause, $._from_clause),
        $.string
      ),
      terminator()
    ),

    import_clause: $ => choice(
      $.namespace_import,
      $.named_imports,
      seq($.identifier, ",", $.namespace_import),
      seq($.identifier, ",", $.named_imports),
      $.identifier
    ),

    _from_clause: $ => seq(
      "from", $.string
    ),

    namespace_import: $ => seq(
      "*", "as", $.identifier
    ),

    named_imports: $ => seq(
      '{', commaSep($.import_specifier), '}'
    ),

    import_specifier: $ => choice(
      $.identifier,
      seq($.identifier, 'as', $.identifier)
    ),


    //
    // Statements
    //

    _statement: $ => choice(
      $.export_statement,
      $.import_statement,
      $.expression_statement,
      $.var_declaration,
      $.statement_block,

      $.if_statement,
      $.switch_statement,
      $.for_statement,
      $.for_in_statement,
      $.for_of_statement,
      $.while_statement,
      $.do_statement,
      $.try_statement,

      $.break_statement,
      $.return_statement,
      $.yield_statement,
      $.throw_statement,
      $.empty_statement
    ),

    expression_statement: $ => seq(
      err(choice($._expression, $.comma_op)), terminator()
    ),

    trailing_expression_statement: $ => seq(
      choice($._expression, $.comma_op)
    ),

    var_declaration: $ => seq(
      variableType(),
      commaSep1(err(choice(
        $.identifier,
        $.var_assignment
      ))),
      terminator()
    ),

    statement_block: $ => seq(
      '{', err(optional($._statements)), '}'
    ),

    if_statement: $ => prec.right(seq(
      'if',
      $._paren_expression,
      $._statement,
      optional(seq(
        'else',
        $._statement
      ))
    )),

    switch_statement: $ => seq(
      'switch',
      '(', $._expression, ')',
      '{', repeat(choice($.case, $.default)), '}'
    ),

    for_statement: $ => seq(
      'for',
      '(',
      choice(
        $.var_declaration,
        seq(err(commaSep1($._expression)), ';'),
        ';'
      ),
      optional(err($._expression)), ';',
      optional(err($._expression)),
      ')',
      $._statement
    ),

    for_in_statement: $ => seq(
      'for',
      '(',
      optional(variableType()),
      $._expression,
      'in',
      $._expression,
      ')',
      $._statement
    ),

    for_of_statement: $ => seq(
      'for',
      '(',
      optional(variableType()),
      $._expression,
      'of',
      $._expression,
      ')',
      $._statement
    ),

    while_statement: $ => seq(
      'while',
      $._paren_expression,
      $._statement
    ),

    do_statement: $ => seq(
      'do',
      $.statement_block,
      'while',
      $._paren_expression,
      terminator()
    ),

    try_statement: $ => seq(
      'try',
      $.statement_block,
      optional($.catch),
      optional($.finally)
    ),

    break_statement: $ => seq(
      'break',
      terminator()
    ),

    trailing_break_statement: $ => 'break',

    return_statement: $ => seq(
      'return',
      optional($._expression),
      terminator()
    ),

    trailing_return_statement: $ => seq(
      'return',
      optional($._expression)
    ),

    yield_statement: $ => seq(
      'yield',
      optional($._expression),
      terminator()
    ),

    trailing_yield_statement: $ => seq(
      'yield',
      optional($._expression)
    ),

    throw_statement: $ => seq(
      'throw',
      $._expression,
      terminator()
    ),

    trailing_throw_statement: $ => seq(
      'throw',
      $._expression
    ),

    empty_statement: $ => ';',

    //
    // Statement components
    //

    case: $ => seq(
      'case',
      $._expression,
      ':',
      optional($._statements)
    ),

    default: $ => seq(
      'default',
      ':',
      optional($._statements)
    ),

    catch: $ => seq(
      'catch',
      optional(seq('(', $.identifier, ')')),
      $.statement_block
    ),

    finally: $ => seq(
      'finally',
      $.statement_block
    ),

    var_assignment: $ => seq(
      $.identifier,
      '=',
      $._expression
    ),

    _paren_expression: $ => seq(
      '(', err(choice($._expression, $.comma_op)), ')'
    ),

    //
    // Expressions
    //

    _expression: $ => choice(
      $.object,
      $.array,
      $.class,
      $.function,
      $.arrow_function,
      $.generator_function,
      $.function_call,
      $.new_expression,
      $.await_expression,
      $.member_access,
      $.subscript_access,
      $.assignment,
      $.math_assignment,
      $.ternary,
      $.bool_op,
      $.math_op,
      $.bitwise_op,
      $.rel_op,
      $.type_op,
      $.delete_op,
      $.void_op,
      $._paren_expression,

      $.this_expression,
      $.identifier,
      $.number,
      $.string,
      $.template_string,
      $.regex,
      $.true,
      $.false,
      $.null,
      $.undefined
    ),

    object: $ => prec(PREC.OBJECT, seq(
      '{', commaSep(err(choice($.pair, $.method_definition))), '}'
    )),

    array: $ => seq(
      '[', commaSep(err($._expression)), ']'
    ),

    // Anonymous class declarations only occur in exports
    anonymous_class: $ => choice(
      seq('class', $._class_tail)
    ),

    // An identifiable class.
    class: $ => seq(
      'class',
      $.identifier,
      $._class_tail
    ),

    // The superclass and body of a class.
    _class_tail: $ => seq(
      optional(seq('extends', $._expression)),
      $.class_body
    ),

    function: $ => seq(
      optional('async'),
      'function',
      optional($.identifier),
      '(', optional($.formal_parameters), ')',
      $.statement_block
    ),

    arrow_function: $ => seq(
      optional('async'),
      choice(
        $.identifier,
        seq('(', optional($.formal_parameters), ')')
      ),
      '=>',
      choice(
        $._expression,
        $.statement_block
      )
    ),

    generator_function: $ => seq(
      'function',
      '*',
      optional($.identifier),
      '(', optional($.formal_parameters), ')',
      $.statement_block
    ),

    function_call: $ => prec(PREC.CALL, seq(
      choice($._expression, $.super),
      '(', err(optional($.arguments)), ')'
    )),

    new_expression: $ => prec(PREC.NEW, seq(
      'new',
      $._expression
    )),

    await_expression: $ => seq(
      'await',
      $._expression
    ),

    member_access: $ => prec(PREC.MEMBER, seq(
      $._expression,
      '.',
      $.identifier
    )),

    subscript_access: $ => prec.right(PREC.MEMBER, seq(
      $._expression,
      '[', err($._expression), ']'
    )),

    assignment: $ => prec.right(PREC.ASSIGN, seq(
      choice(
        $.identifier,
        $.member_access,
        $.subscript_access
      ),
      '=',
      $._expression
    )),

    math_assignment: $ => prec.right(PREC.ASSIGN, seq(
      choice(
        $.identifier,
        $.member_access,
        $.subscript_access
      ),
      choice('+=', '-=', '*=', '/='),
      $._expression
    )),

    ternary: $ => prec.right(PREC.TERNARY, seq(
      $._expression, '?', $._expression, ':', $._expression
    )),

    bool_op: $ => choice(
      prec.left(PREC.NOT, seq('!', $._expression)),
      prec.left(PREC.AND, seq($._expression, '&&', $._expression)),
      prec.left(PREC.OR, seq($._expression, '||', $._expression))
    ),

    bitwise_op: $ => choice(
      prec.left(PREC.NOT, seq('~', $._expression)),
      prec.left(PREC.TIMES, seq($._expression, '>>', $._expression)),
      prec.left(PREC.TIMES, seq($._expression, '<<', $._expression)),
      prec.left(PREC.AND, seq($._expression, '&', $._expression)),
      prec.left(PREC.OR, seq($._expression, '^', $._expression)),
      prec.left(PREC.OR, seq($._expression, '|', $._expression))
    ),

    math_op: $ => choice(
      prec.left(PREC.NEG, seq('-', $._expression)),
      prec.left(PREC.NEG, seq('+', $._expression)),
      prec.left(PREC.INC, seq($._expression, '++')),
      prec.left(PREC.INC, seq($._expression, '--')),
      prec.left(PREC.INC, seq('++', $._expression)),
      prec.left(PREC.INC, seq('--', $._expression)),
      prec.left(PREC.PLUS, seq($._expression, '+', $._expression)),
      prec.left(PREC.PLUS, seq($._expression, '-', $._expression)),
      prec.left(PREC.TIMES, seq($._expression, '*', $._expression)),
      prec.left(PREC.TIMES, seq($._expression, '/', $._expression)),
      prec.left(PREC.TIMES, seq($._expression, '%', $._expression))
    ),

    delete_op: $ => prec(PREC.DELETE, seq(
      'delete',
      choice($.member_access, $.subscript_access))
    ),

    void_op: $ => prec(PREC.VOID, seq(
      'void', $._expression)
    ),

    comma_op: $ => prec(PREC.COMMA, seq(
      $._expression, ',', choice($.comma_op, $._expression))
    ),

    rel_op: $ => choice(
      prec.left(PREC.REL, seq($._expression, '<', $._expression)),
      prec.left(PREC.REL, seq($._expression, '<=', $._expression)),
      prec.left(PREC.REL, seq($._expression, '==', $._expression)),
      prec.left(PREC.REL, seq($._expression, '===', $._expression)),
      prec.left(PREC.REL, seq($._expression, '!=', $._expression)),
      prec.left(PREC.REL, seq($._expression, '!==', $._expression)),
      prec.left(PREC.REL, seq($._expression, '>=', $._expression)),
      prec.left(PREC.REL, seq($._expression, '>', $._expression))
    ),

    type_op: $ => choice(
      prec(PREC.TYPEOF, seq('typeof', $._expression)),
      prec.left(PREC.REL, seq($._expression, 'instanceof', $._expression)),
      prec.left(PREC.REL, seq($._expression, 'in', $._expression))
    ),

    //
    // Primitives
    //

    comment: $ => token(choice(
      seq('//', /.*/),
      seq('/*', repeat(choice(/[^\*]/, /\*[^\/]/)), '*/')
    )),

    string: $ => token(choice(
      seq('"', repeat(choice(/[^\\"\n]/, /\\./)), '"'),
      seq("'", repeat(choice(/[^\\'\n]/, /\\./)), "'")
    )),

    template_string: $ => token(seq(
      '`', repeat(/[^`]/), '`'
    )),

    regex: $ => token(seq(
      '/',
      repeat(choice(
        seq('[', /[^\]\n]*/, ']'), // square-bracket-delimited character class
        seq('\\', /./),            // escaped character
        /[^/\\\[\n]/               // any character besides '[', '\', '/', '\n'
      )),
      '/',
      repeat(/a-z/)
    )),

    number: $ => token(choice(
      seq(
        '0x',
        /[\da-fA-F]+/
      ),
      seq(
        /\d+/,
        optional(seq('.', /\d*/))
      )
    )),

    identifier: $ => (/[\a_$][\a\d_$]*/),

    this_expression: $ => 'this',
    super: $ => 'super',
    true: $ => 'true',
    false: $ => 'false',
    null: $ => 'null',
    undefined: $ => 'undefined',

    //
    // Expression components
    //

    arguments: $ => commaSep1(err($._expression)),

    class_body: $ => seq(
      '{',
      repeat(seq(
        optional('static'),
        $.method_definition,
        optional(';')
      )),
      '}'
    ),

    formal_parameters: $ => commaSep1($.identifier),

    method_definition: $ => seq(
      optional('async'),
      optional(choice('get', 'set', '*')),
      $.identifier,
      '(',
      optional($.formal_parameters),
      ')',
      $.statement_block
    ),

    pair: $ => seq(
      choice($.identifier, $.reserved_identifier, $.string, $.number),
      ':',
      $._expression
    ),

    reserved_identifier: $ => choice('get', 'set', 'async'),

    _line_break: $ => '\n'
  }
});

function commaSep1 (rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep (rule) {
  return optional(commaSep1(rule));
}

function terminator () {
  return choice(';', sym('_line_break'));
}

function variableType () {
  return choice('var', 'let', 'const');
}
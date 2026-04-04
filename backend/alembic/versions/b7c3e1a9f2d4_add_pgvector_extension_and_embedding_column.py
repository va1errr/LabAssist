"""add pgvector extension and embedding column to lab_doc

Revision ID: b7c3e1a9f2d4
Revises: 4a95a59a5d41
Create Date: 2026-04-04 16:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector


# revision identifiers
revision: str = 'b7c3e1a9f2d4'
down_revision: Union[str, None] = '4a95a59a5d41'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create the pgvector extension (if not exists)
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    # 2. Add the embedding column to lab_doc
    op.add_column('lab_doc', sa.Column('embedding', Vector(384), nullable=True))


def downgrade() -> None:
    # 1. Remove the embedding column
    op.drop_column('lab_doc', 'embedding')

    # 2. Remove the vector extension (only if no other extensions depend on it)
    op.execute('DROP EXTENSION IF EXISTS vector')
